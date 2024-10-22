// _worker.js

// Docker镜像仓库主机地址
let hub_host = 'registry-1.docker.io';
// Docker认证服务器地址
const auth_url = 'https://auth.docker.io';

let workers_url = 'https://xxx/';

let 屏蔽爬虫UA = ['netcraft'];

// 根据主机名选择对应的上游地址
function routeByHosts(host) {
    // Docker相关的路由
    const routes = {
        "docker": "registry-1.docker.io",
        "test": "registry-1.docker.io",
    };

    if (host in routes) return [routes[host], false];
    else return [hub_host, true];
}

const PREFLIGHT_INIT = {
    headers: new Headers({
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS',
        'access-control-max-age': '1728000',
    }),
}

function makeRes(body, status = 200, headers = {}) {
    headers['access-control-allow-origin'] = '*'
    return new Response(body, { status, headers })
}

function newUrl(urlStr) {
    try {
        return new URL(urlStr)
    } catch (err) {
        return null
    }
}

function isUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

async function nginx() {
    const text = `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Welcome to nginx!</title>
    <style>
        body {
            width: 35em;
            margin: 0 auto;
            font-family: Tahoma, Verdana, Arial, sans-serif;
        }
    </style>
    </head>
    <body>
    <h1>Welcome to nginx!</h1>
    <p>If you see this page, the nginx web server is successfully installed and
    working. Further configuration is required.</p>
    
    <p>For online documentation and support please refer to
    <a href="http://nginx.org/">nginx.org</a>.<br/>
    Commercial support is available at
    <a href="http://nginx.com/">nginx.com</a>.</p>
    
    <p><em>Thank you for using nginx.</em></p>
    </body>
    </html>
    `
    return text;
}

async function searchInterface() {
    const text = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Docker Hub 镜像搜索</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
        <style>
            :root {
                --primary-color: #0db7ed;
                --secondary-color: #002c66;
                --text-color: #ffffff;
                --bg-color: #f0f8ff;
            }
            body, html {
                height: 100%;
                margin: 0;
                font-family: 'Roboto', sans-serif;
                background: var(--bg-color);
                color: var(--secondary-color);
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 2rem;
            }
            header {
                text-align: center;
                margin-bottom: 2rem;
            }
            .logo {
                width: 150px;
                margin-bottom: 1rem;
            }
            h1 {
                font-size: 2.5rem;
                color: var(--secondary-color);
            }
            .search-container {
                background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
                padding: 2rem;
                border-radius: 10px;
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            }
            .search-box {
                display: flex;
                justify-content: center;
                margin-bottom: 1rem;
            }
            #search-input {
                width: 70%;
                padding: 12px 20px;
                font-size: 18px;
                border: none;
                border-radius: 25px 0 0 25px;
                outline: none;
                background: rgba(255, 255, 255, 0.9);
            }
            #search-button {
                background: var(--secondary-color);
                color: var(--text-color);
                border: none;
                padding: 12px 20px;
                border-radius: 0 25px 25px 0;
                cursor: pointer;
                transition: background 0.3s ease;
            }
            #search-button:hover {
                background: #001f4d;
            }
            #search-tips {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 5px;
                padding: 1rem;
                margin-top: 1rem;
                color: var(--text-color);
            }
            .popular-searches {
                margin-top: 2rem;
                text-align: center;
            }
            .popular-searches h3 {
                color: var(--secondary-color);
                margin-bottom: 1rem;
            }
            .tag {
                display: inline-block;
                background: var(--primary-color);
                color: var(--text-color);
                padding: 8px 15px;
                border-radius: 20px;
                margin: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .tag:hover {
                background: var(--secondary-color);
                transform: translateY(-2px);
            }
            .features {
                display: flex;
                justify-content: space-around;
                margin-top: 3rem;
            }
            .feature {
                text-align: center;
                padding: 1rem;
                background: white;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
            }
            .feature:hover {
                transform: translateY(-5px);
                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
            }
            .feature img {
                width: 64px;
                height: 64px;
                margin-bottom: 1rem;
            }
            footer {
                text-align: center;
                margin-top: 3rem;
                padding: 1rem;
                background: var(--secondary-color);
                color: var(--text-color);
            }
            @media (max-width: 768px) {
                .search-box {
                    flex-direction: column;
                }
                #search-input, #search-button {
                    width: 100%;
                    border-radius: 25px;
                    margin-bottom: 1rem;
                }
                .features {
                    flex-direction: column;
                }
                .feature {
                    margin-bottom: 1rem;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <img src="https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png" alt="Docker Logo" class="logo">
                <h1>Docker Hub 镜像搜索</h1>
            </header>
            <div class="search-container">
                <div class="search-box">
                    <input type="text" id="search-input" placeholder="搜索 Docker 镜像、容器或服务">
                    <button id="search-button">搜索</button>
                </div>
                <div id="search-tips">
                    <p>搜索提示：输入关键词以开始搜索，例如 "nginx"、"mysql:latest" 等。</p>
                </div>
            </div>
            <div class="popular-searches">
                <h3>热门搜索</h3>
                <div class="tags">
                    <span class="tag">nginx</span>
                    <span class="tag">mysql</span>
                    <span class="tag">redis</span>
                    <span class="tag">ubuntu</span>
                    <span class="tag">python</span>
                    <span class="tag">node</span>
                    <span class="tag">php</span>
                    <span class="tag">postgres</span>
                </div>
            </div>
            <div class="features">
                <div class="feature">
                    <img src="https://cdn-icons-png.flaticon.com/512/2092/2092663.png" alt="快速搜索">
                    <h3>快速搜索</h3>
                    <p>迅速找到您需要的 Docker 镜像</p>
                </div>
                <div class="feature">
                    <img src="https://cdn-icons-png.flaticon.com/512/1835/1835211.png" alt="版本对比">
                    <h3>版本对比</h3>
                    <p>轻松比较不同版本的 Docker 镜像</p>
                </div>
                <div class="feature">
                    <img src="https://cdn-icons-png.flaticon.com/512/3208/3208726.png" alt="高级过滤">
                    <h3>高级过滤</h3>
                    <p>使用多种条件精确筛选所需镜像</p>
                </div>
            </div>
        </div>
        <footer>
            <p>&copy; 2024 SZIS Tech. 保留所有权利。</p>
        </footer>
	    <script>
	        function performSearch() {
	            const query = document.getElementById('search-input').value;
	            if (query) {
	                window.location.href = '/search?q=' + encodeURIComponent(query);
	            }
	        }
	    
	        document.getElementById('search-button').addEventListener('click', performSearch);
	        document.getElementById('search-input').addEventListener('keypress', function(event) {
	            if (event.key === 'Enter') {
	                performSearch();
	            }
	        });

	        document.querySelectorAll('.tag').forEach(tag => {
	            tag.addEventListener('click', function() {
	                document.getElementById('search-input').value = this.textContent;
	                performSearch();
	            });
	        });

	        document.getElementById('search-input').addEventListener('input', function() {
	            const searchTips = document.getElementById('search-tips');
	            if (this.value.length > 0) {
	                searchTips.innerHTML = '<p>输入完成后，请点击搜索按钮或按回车键开始搜索 "' + this.value + '"</p>';
	            } else {
	                searchTips.innerHTML = '<p>搜索提示：输入关键词以开始搜索，例如 "nginx"、"mysql:latest" 等。</p>';
	            }
	        });
	    </script>
    </body>
    </html>
    `;
    return text;
}

export default {
    async fetch(request, env, ctx) {
        const getReqHeader = (key) => request.headers.get(key);

        let url = new URL(request.url);
        const userAgentHeader = request.headers.get('User-Agent');
        const userAgent = userAgentHeader ? userAgentHeader.toLowerCase() : "null";
        if (env.UA) 屏蔽爬虫UA = 屏蔽爬虫UA.concat(await ADD(env.UA));
        workers_url = `https://${url.hostname}`;
        const pathname = url.pathname;

        const ns = url.searchParams.get('ns'); 
        const hostname = url.searchParams.get('hubhost') || url.hostname;
        const hostTop = hostname.split('.')[0];

        let checkHost;
        if (ns) {
            if (ns === 'docker.io') {
                hub_host = 'registry-1.docker.io';
            } else {
                hub_host = ns;
            }
        } else {
            checkHost = routeByHosts(hostTop);
            hub_host = checkHost[0];
        }

        const fakePage = checkHost ? checkHost[1] : false;
        console.log(`域名头部: ${hostTop}\n反代地址: ${hub_host}\n伪装首页: ${fakePage}`);
        const isUuid = isUUID(pathname.split('/')[1].split('/')[0]);

        if (屏蔽爬虫UA.some(fxxk => userAgent.includes(fxxk)) && 屏蔽爬虫UA.length > 0) {
            return new Response(await nginx(), {
                headers: {
                    'Content-Type': 'text/html; charset=UTF-8',
                },
            });
        }

        const conditions = [
            isUuid,
            pathname.includes('/_'),
            pathname.includes('/r/'),
            pathname.includes('/v2/repositories'),
			pathname.includes('/v2/namespaces'),
			pathname.includes('/v2/auditlogs'),
			pathname.includes('/v2/access-tokens'),
            pathname.includes('/v2/user'),
            pathname.includes('/v2/orgs'),
            pathname.includes('/v2/_catalog'),
            pathname.includes('/v2/categories'),
            pathname.includes('/v2/feature-flags'),
            pathname.includes('search'),
            pathname.includes('source'),
            pathname == '/',
            pathname == '/favicon.ico',
            pathname == '/auth/profile',
        ];

        if (conditions.some(condition => condition) && (fakePage === true || hostTop == 'docker')) {
            if (env.URL302) {
                return Response.redirect(env.URL302, 302);
            } else if (env.URL) {
                if (env.URL.toLowerCase() == 'nginx') {
                    return new Response(await nginx(), {
                        headers: {
                            'Content-Type': 'text/html; charset=UTF-8',
                        },
                    });
                } else return fetch(new Request(env.URL, request));
} else if (url.pathname == '/'){
                return new Response(await searchInterface(), {
                    headers: {
                      'Content-Type': 'text/html; charset=UTF-8',
                    },
                });
            }
            
            const newUrl = new URL("https://registry.hub.docker.com" + pathname + url.search);

            const headers = new Headers(request.headers);
            headers.set('Host', 'registry.hub.docker.com');

            const newRequest = new Request(newUrl, {
                    method: request.method,
                    headers: headers,
                    body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.blob() : null,
                    redirect: 'follow'
            });

            return fetch(newRequest);
        }

        if (!/%2F/.test(url.search) && /%3A/.test(url.toString())) {
            let modifiedUrl = url.toString().replace(/%3A(?=.*?&)/, '%3Alibrary%2F');
            url = new URL(modifiedUrl);
            console.log(`handle_url: ${url}`);
        }

        if (url.pathname.includes('/token')) {
            let token_parameter = {
                headers: {
                    'Host': 'auth.docker.io',
                    'User-Agent': getReqHeader("User-Agent"),
                    'Accept': getReqHeader("Accept"),
                    'Accept-Language': getReqHeader("Accept-Language"),
                    'Accept-Encoding': getReqHeader("Accept-Encoding"),
                    'Connection': 'keep-alive',
                    'Cache-Control': 'max-age=0'
                }
            };
            let token_url = auth_url + url.pathname + url.search;
            return fetch(new Request(token_url, request), token_parameter);
        }

        if ( hub_host == 'registry-1.docker.io' && /^\/v2\/[^/]+\/[^/]+\/[^/]+$/.test(url.pathname) && !/^\/v2\/library/.test(url.pathname)) {
            url.pathname = '/v2/library/' + url.pathname.split('/v2/')[1];
            console.log(`modified_url: ${url.pathname}`);
        }

        url.hostname = hub_host;

        let parameter = {
            headers: {
                'Host': hub_host,
                'User-Agent': getReqHeader("User-Agent"),
                'Accept': getReqHeader("Accept"),
                'Accept-Language': getReqHeader("Accept-Language"),
                'Accept-Encoding': getReqHeader("Accept-Encoding"),
                'Connection': 'keep-alive',
                'Cache-Control': 'max-age=0'
            },
            cacheTtl: 3600
        };

        if (request.headers.has("Authorization")) {
            parameter.headers.Authorization = getReqHeader("Authorization");
        }

        let original_response = await fetch(new Request(url, request), parameter);
        let original_response_clone = original_response.clone();
        let original_text = original_response_clone.body;
        let response_headers = original_response.headers;
        let new_response_headers = new Headers(response_headers);
        let status = original_response.status;

        if (new_response_headers.get("Www-Authenticate")) {
            let auth = new_response_headers.get("Www-Authenticate");
            let re = new RegExp(auth_url, 'g');
            new_response_headers.set("Www-Authenticate", response_headers.get("Www-Authenticate").replace(re, workers_url));
        }

        if (new_response_headers.get("Location")) {
            return httpHandler(request, new_response_headers.get("Location"));
        }

        let response = new Response(original_text, {
            status,
            headers: new_response_headers
        });
        return response;
    }
};

function httpHandler(req, pathname) {
    const reqHdrRaw = req.headers;

    if (req.method === 'OPTIONS' &&
        reqHdrRaw.has('access-control-request-headers')
    ) {
        return new Response(null, PREFLIGHT_INIT);
    }

    let rawLen = '';

    const reqHdrNew = new Headers(reqHdrRaw);

    const refer = reqHdrNew.get('referer');

    let urlStr = pathname;

    const urlObj = newUrl(urlStr);

    /** @type {RequestInit} */
    const reqInit = {
        method: req.method,
        headers: reqHdrNew,
        redirect: 'follow',
        body: req.body
    };
    return proxy(urlObj, reqInit, rawLen);
}

async function proxy(urlObj, reqInit, rawLen) {
    const res = await fetch(urlObj.href, reqInit);
    const resHdrOld = res.headers;
    const resHdrNew = new Headers(resHdrOld);

    if (rawLen) {
        const newLen = resHdrOld.get('content-length') || '';
        const badLen = (rawLen !== newLen);

        if (badLen) {
            return makeRes(res.body, 400, {
                '--error': `bad len: ${newLen}, except: ${rawLen}`,
                'access-control-expose-headers': '--error',
            });
        }
    }
    const status = res.status;
    resHdrNew.set('access-control-expose-headers', '*');
    resHdrNew.set('access-control-allow-origin', '*');
    resHdrNew.set('Cache-Control', 'max-age=1500');

    resHdrNew.delete('content-security-policy');
    resHdrNew.delete('content-security-policy-report-only');
    resHdrNew.delete('clear-site-data');

    return new Response(res.body, {
        status,
        headers: resHdrNew
    });
}

async function ADD(envadd) {
    var addtext = envadd.replace(/[	 |"'\r\n]+/g, ',').replace(/,+/g, ',');
    if (addtext.charAt(0) == ',') addtext = addtext.slice(1);
    if (addtext.charAt(addtext.length - 1) == ',') addtext = addtext.slice(0, addtext.length - 1);
    const add = addtext.split(',');
    return add;
}
