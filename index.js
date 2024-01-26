var axios = require('axios');
var schedule = require('node-schedule');
var { generateHMACMD5 } = require('./utils/hmacmd5');
var { calculateSHA1 } = require('./utils/sha1');
var { encodeUserInfo } = require('./utils/encodeUserInfo');
var os = require('os');

// 用户信息配置
var userConfig = {
    username: '107332XXXXXX', // 用户名
    password: 'yourPassword', // 密码
};

// 配置请求头
var axiosInstance = axios.create({
    headers: {
        'Host': '202.201.64.139',
        'Connection': 'keep-alive',
        'Accept': 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'http://202.201.64.139/srun_portal_pc?ac_id=1&theme=pro', 
        'Accept-Language': 'zh-CN,zh;q=0.9,zh-TW;q=0.8,en;q=0.7'
    }
});

// 解析JSONP响应
var parseJSONP = (jsonp) => {
    var jsonpData = jsonp.substring(jsonp.indexOf('(') + 1, jsonp.lastIndexOf(')'));
    return JSON.parse(jsonpData);
};

// 检查在线状态
var clientIp = null;
var checkOnlineStatus = async () => {
    var callbackValue = `pcfanlxz_${Date.now()}`;
    try {
        var response = await axiosInstance.get(`http://202.201.64.139/cgi-bin/rad_user_info?callback=${callbackValue}`);
        var data = parseJSONP(response.data);
        clientIp = data.client_ip;
        if (data.res === 'not_online_error') {
            console.log('You are currently offline')
            return false;
        } else if (data.ServerFlag === 4294967040) {
            console.log('You are currently online')
            console.log('Switch to detection mode')
            return true;
        }
    } catch (error) {
        console.error('Error checking online status:', error);
        return false;
    }
};

// 获取token
var getToken = async () => {
    var callbackValue = `pcfanlxz_${Date.now()}`;
    try {
        var response = await axiosInstance.get(`http://202.201.64.139/cgi-bin/get_challenge?callback=${callbackValue}&username=${userConfig.username}&ip=${clientIp}`);
        var data = parseJSONP(response.data);
        return data.challenge;
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
};
  

// 登录过程
var login = async () => {
    var timestamp = Date.now();
    var callbackValue = `pcfanlxz_${timestamp}`;
    try {
        var token = await getToken();
        if (!token) {
            console.error('Failed to get token');
            return false;
        }
        // 等待100毫秒
        await new Promise(resolve => setTimeout(resolve, 100));
        // 构造登录请求
        var passwordEncrypted = generateHMACMD5(userConfig.password, token);
        var info = {
        username: userConfig.username,
        password: userConfig.password,
        ip: clientIp,
        acid: '1',
        enc_ver: 'srun_bx1',
        };
        var type = 1;
        var n = 200;
        var infoEncrypted = encodeUserInfo(info, token);
        var inputString = token + userConfig.username;
        inputString += token + passwordEncrypted;
        inputString += token + info.acid;
        inputString += token + clientIp;
        inputString += token + n;
        inputString += token + type;
        inputString += token + infoEncrypted;
        var chksum = calculateSHA1(inputString);
        var _ = timestamp + 3;
        
        var requestUrl = `http://202.201.64.139/cgi-bin/srun_portal?callback=${encodeURIComponent(callbackValue)}&action=login&username=${encodeURIComponent(userConfig.username)}&password=%7BMD5%7D${encodeURIComponent(passwordEncrypted)}&os=Windows+10&name=Windows&double_stack=0&chksum=${encodeURIComponent(chksum)}&info=${encodeURIComponent(infoEncrypted)}&ac_id=1&ip=${encodeURIComponent(clientIp)}&n=200&type=1&_=${encodeURIComponent(_)}`;

        var response = await axiosInstance.get(requestUrl);
        var data = parseJSONP(response.data);
        if (data.error !== 'ok') {
            console.log(data.error_msg);
            console.log('Password error, please change the password and run again');
        }else if(data.ploy_msg) {
            console.log(data.ploy_msg);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        return checkOnlineStatus();
    } catch (error) {
        console.error('Error during login process:', error);
        return false;
    }
};

// 定时检查任务
var startMonitoring = async () => {
    // 每两小时执行一次
    schedule.scheduleJob('0 */2 * * *', async () => {
        var online = await checkOnlineStatus();
        if (!online) {
            console.log('Not online, attempting to log in...');
            var loginSuccess = await login();
            if (!loginSuccess) {
                console.log('Login failed, retrying in 5 minutes...');
                setTimeout(login, 5 * 60 * 1000); // 5分钟后重试
            }
        }
    });

    // 立即执行一次登录状态检查
    var online = await checkOnlineStatus();
    if (!online) {
        await login();
    }
};

// 启动监控
startMonitoring();
