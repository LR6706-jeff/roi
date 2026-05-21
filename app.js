App({
  onLaunch() {
    // 初始化云开发环境 (如果使用免费混元 API，可开启此项)
    if (wx.cloud) {
      wx.cloud.init({
        env: 'roi-d0gji1w1oce195b1f',
        traceUser: true
      })
    }
  }
})
