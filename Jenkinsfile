pipeline {
  agent any
  stages {
    stage('检出') {
      steps {
        checkout([
          $class: 'GitSCM',
          branches: [[name: GIT_BUILD_REF]],
          userRemoteConfigs: [[
            url: GIT_REPO_URL,
            credentialsId: CREDENTIALS_ID
          ]]])
        }
      }
      stage('构建') {
        agent {
          // 使用 coding 提供的 nodejs 镜像
          docker {
            reuseNode 'true'
            registryUrl 'https://coding-public-docker.pkg.coding.net'
            image 'public/docker/nodejs:14'
          }

        }
        steps {
          // 主题更新
          sh 'git clone https://github.com/f-dong/hexo-theme-minimalism.git themes/hexo-theme-minimalism'
          sh 'mv -f theme_config.yml themes/hexo-theme-minimalism/_config.yml'
          sh 'npm install'
          sh 'npm run build'
          sh 'mv -f favicon.ico public/favicon.ico'
          sh 'cd public && tar -zcvf blog.tar.gz *'
        }
      }
      stage("部署") {
        steps {
          script {
            def remoteConfig = [:]
            remoteConfig.name = "my-remote-server"
            remoteConfig.host = "${REMOTE_HOST}"
            remoteConfig.port = "${REMOTE_SSH_PORT}".toInteger()
            remoteConfig.allowAnyHosts = true

            withCredentials([
              sshUserPrivateKey(
                credentialsId: "${REMOTE_CRED}",
                keyFileVariable: "privateKeyFilePath"
              )
            ]) {
              // SSH 登陆用户名
              remoteConfig.user = "${REMOTE_USER_NAME}"
              // SSH 私钥文件地址
              remoteConfig.identityFile = privateKeyFilePath

              sshPut(remote: remoteConfig, from: 'public/blog.tar.gz', into: "/tmp")
              sshCommand(remote: remoteConfig, command: "mkdir -p ${DEPLOYMENT_DIRECTORY}_new && tar -zxvf /tmp/blog.tar.gz -C ${DEPLOYMENT_DIRECTORY}_new")
              sshRemove(remote: remoteConfig, path: "${DEPLOYMENT_DIRECTORY}")
              sshCommand(remote: remoteConfig, command: "mv -f ${DEPLOYMENT_DIRECTORY}_new ${DEPLOYMENT_DIRECTORY}")
              sshRemove(remote: remoteConfig, path: '/tmp/blog.tar.gz')
            }
          }
      }
    }
  }
}