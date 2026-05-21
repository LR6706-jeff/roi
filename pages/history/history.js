Page({
  data: {
    historyList: [],
    showAd: false // 🎯 广告显示开关。默认为 false，开通流量主后改为 true 并填入广告ID即可。
  },

  onShow() {
    this.loadHistory();
  },

  loadHistory() {
    try {
      const list = wx.getStorageSync('calc_history') || [];
      // 对时间戳格式化
      const formattedList = list.map(item => {
        const date = new Date(item.timestamp);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        return {
          ...item,
          timeStr: `${y}-${m}-${d} ${hh}:${mm}`
        };
      });
      // 倒序排列，最新计算在最上面
      formattedList.sort((a, b) => b.timestamp - a.timestamp);
      this.setData({ historyList: formattedList });
    } catch (e) {
      console.error("加载历史记录失败", e);
    }
  },

  deleteItem(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除记录',
      content: '确定要删除这条计算记录吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            const list = wx.getStorageSync('calc_history') || [];
            const newList = list.filter(item => item.id !== id);
            wx.setStorageSync('calc_history', newList);
            this.loadHistory();
            wx.showToast({
              title: '已删除',
              icon: 'success'
            });
          } catch (err) {
            console.error("删除记录失败", err);
          }
        }
      }
    });
  },

  clearHistory() {
    wx.showModal({
      title: '清空历史',
      content: '确定要清空所有的历史计算记录吗？此操作不可恢复。',
      confirmColor: '#cf222e',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.setStorageSync('calc_history', []);
            this.setData({ historyList: [] });
            wx.showToast({
              title: '已清空',
              icon: 'success'
            });
          } catch (err) {
            console.error("清空历史失败", err);
          }
        }
      }
    });
  }
});
