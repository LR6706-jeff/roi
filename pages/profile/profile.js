Page({
  data: {
    totalCount: 0,
    recentCount: 0,
    kolCount: 0,
    shopCount: 0,
    kolPercentage: 0,
    shopPercentage: 0,
    avgKolBreakEven: '--',
    avgShopBreakEven: '--'
  },

  onShow() {
    this.calculateStats();
  },

  calculateStats() {
    try {
      const list = wx.getStorageSync('calc_history') || [];
      // 基于最近 200 条记录
      const statsList = list.slice(0, 200);

      const totalCount = statsList.length;
      
      // 计算近 7 天记录数
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentCount = statsList.filter(item => item.timestamp >= sevenDaysAgo).length;

      // 分类数量
      const kolCount = statsList.filter(item => item.type === '达人版').length;
      const shopCount = statsList.filter(item => item.type === '商家版').length;

      // 计算百分比
      let kolPercentage = 0;
      let shopPercentage = 0;
      if (totalCount > 0) {
        kolPercentage = Math.round((kolCount / totalCount) * 100);
        shopPercentage = 100 - kolPercentage;
      }

      // 计算平均保本 ROI
      const kolItems = statsList.filter(item => item.type === '达人版' && item.calcResults && item.calcResults.breakEvenRoi);
      const shopItems = statsList.filter(item => item.type === '商家版' && item.calcResults && item.calcResults.breakEvenRoi);

      let avgKolBreakEven = '--';
      if (kolItems.length > 0) {
        const sum = kolItems.reduce((acc, cur) => acc + parseFloat(cur.calcResults.breakEvenRoi), 0);
        avgKolBreakEven = (sum / kolItems.length).toFixed(2);
      }

      let avgShopBreakEven = '--';
      if (shopItems.length > 0) {
        const sum = shopItems.reduce((acc, cur) => acc + parseFloat(cur.calcResults.breakEvenRoi), 0);
        avgShopBreakEven = (sum / shopItems.length).toFixed(2);
      }

      this.setData({
        totalCount,
        recentCount,
        kolCount,
        shopCount,
        kolPercentage,
        shopPercentage,
        avgKolBreakEven,
        avgShopBreakEven
      });
    } catch (e) {
      console.error("计算统计数据失败", e);
    }
  }
});
