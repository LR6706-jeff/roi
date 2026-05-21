Page({
  data: {
    mode: 'shop', // 'shop' (商家版) 或 'kol' (达人版)

    // 商家版输入数据
    price: '100',
    cost: '30',
    logistics: '5',
    platformRate: '5', // 5%
    refundRate: '15',   // 15%
    adSpend: '500',
    orders: '10',

    // 达人版输入数据
    commRate: '20',     // 佣金率 20%
    kolOrders: '50',    // 预估销量
    kolAdSpend: '300',  // 广告花费
    withdrawRate: '0',    // 提现费率 0%
    quickRefundRate: '0', // 1h退款率 0%
    
    // 计算结果
    breakEvenRoi: '0.00',
    actualRoi: '0.00',
    netProfit: '0.00',
    profitMargin: '0',
    
    // AI诊断
    aiDiagnosis: ''
  },

  onLoad() {
    this.calculateRoi();
  },

  // 切换达人版/商家版
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      mode,
      aiDiagnosis: '',
      // 切换模式时重置计算结果，确保干净
      breakEvenRoi: '0.00',
      actualRoi: '0.00',
      netProfit: '0.00',
      profitMargin: '0'
    }, () => {
      this.calculateRoi();
    });
  },

  // 监听输入
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [field]: e.detail.value,
      aiDiagnosis: '' // 数据改变时清空 AI 诊断，鼓励重新生成
    }, () => {
      this.calculateRoi();
    });
  },

  // 核心 ROI 计算逻辑
  calculateRoi() {
    const { mode } = this.data;

    if (mode === 'kol') {
      const price = parseFloat(this.data.price) || 0;
      const commRate = parseFloat(this.data.commRate) || 0;
      const kolOrders = parseFloat(this.data.kolOrders) || 0;
      const kolAdSpend = parseFloat(this.data.kolAdSpend) || 0;
      const withdrawRate = (parseFloat(this.data.withdrawRate) || 0) / 100;
      const quickRefundRate = (parseFloat(this.data.quickRefundRate) || 0) / 100;

      if (price <= 0 || commRate <= 0) return;

      // 1. 达人保本 ROI（含提现费率和1h退款率修正）
      const effectiveCommRate = (commRate / 100) * (1 - quickRefundRate) * (1 - withdrawRate);
      const breakEvenRoi = effectiveCommRate > 0 ? (1 / effectiveCommRate) : 0;

      // 2. 达人实际 ROI = 销售额 / 广告花费
      const revenue = kolOrders * price;
      const actualRoi = kolAdSpend > 0 ? (revenue / kolAdSpend) : (revenue > 0 ? Infinity : null);

      // 3. 达人净佣金收益（扣除1h退款和提现费）
      const effectiveCommission = kolOrders * (1 - quickRefundRate) * price * (commRate / 100) * (1 - withdrawRate);
      const netProfit = effectiveCommission - kolAdSpend;

      // 4. 投流分成利润率 = 净利润 / 实际佣金收益
      const profitMargin = effectiveCommission > 0 ? ((netProfit / effectiveCommission) * 100) : 0;

      this.setData({
        breakEvenRoi: breakEvenRoi.toFixed(2),
        actualRoi: actualRoi === Infinity ? '∞' : (actualRoi === null ? '--' : actualRoi.toFixed(2)),
        netProfit: netProfit.toFixed(2),
        profitMargin: Math.round(profitMargin)
      });
    } else {
      // 商家版原逻辑
      const price = parseFloat(this.data.price) || 0;
      const cost = parseFloat(this.data.cost) || 0;
      const logistics = parseFloat(this.data.logistics) || 0;
      const platformRate = (parseFloat(this.data.platformRate) || 0) / 100;
      const refundRate = (parseFloat(this.data.refundRate) || 0) / 100;
      const adSpend = parseFloat(this.data.adSpend) || 0;
      const orders = parseFloat(this.data.orders) || 0;

      if (price <= 0) return;

      const returnLoss = refundRate * logistics; 
      const unitMargin = price * (1 - platformRate) - cost - logistics - returnLoss;
      
      let breakEvenRoi = 0;
      if (unitMargin > 0) {
        breakEvenRoi = price / unitMargin;
      }

      const revenue = orders * price;
      const actualRoi = adSpend > 0 ? (revenue / adSpend) : (revenue > 0 ? Infinity : null);

      const effectiveOrders = orders * (1 - refundRate);
      const netProfit = effectiveOrders * (price * (1 - platformRate) - cost - logistics) - adSpend;

      const effectiveRevenue = effectiveOrders * price;
      const profitMargin = effectiveRevenue > 0 ? ((netProfit / effectiveRevenue) * 100) : 0;

      this.setData({
        breakEvenRoi: breakEvenRoi.toFixed(2),
        actualRoi: actualRoi === Infinity ? '∞' : (actualRoi === null ? '--' : actualRoi.toFixed(2)),
        netProfit: netProfit.toFixed(2),
        profitMargin: Math.round(profitMargin)
      });
    }
  },

  // 重置表单
  resetForm() {
    if (this.data.mode === 'kol') {
      this.setData({
        price: '',
        commRate: '',
        kolOrders: '',
        kolAdSpend: '',
        withdrawRate: '0',
        quickRefundRate: '0',
        breakEvenRoi: '0.00',
        actualRoi: '0.00',
        netProfit: '0.00',
        profitMargin: '0',
        aiDiagnosis: ''
      });
    } else {
      this.setData({
        price: '',
        cost: '',
        logistics: '',
        platformRate: '',
        refundRate: '',
        adSpend: '',
        orders: '',
        breakEvenRoi: '0.00',
        actualRoi: '0.00',
        netProfit: '0.00',
        profitMargin: '0',
        aiDiagnosis: ''
      });
    }
  },

  // 保存计算记录到本地缓存
  saveToHistory(diagnosisText) {
    try {
      const historyItem = {
        id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 4),
        type: this.data.mode === 'kol' ? '达人版' : '商家版',
        timestamp: Date.now(),
        inputData: this.data.mode === 'kol' ? {
          price: this.data.price,
          commRate: this.data.commRate,
          kolOrders: this.data.kolOrders,
          kolAdSpend: this.data.kolAdSpend
        } : {
          price: this.data.price,
          cost: this.data.cost,
          logistics: this.data.logistics,
          platformRate: this.data.platformRate,
          refundRate: this.data.refundRate,
          adSpend: this.data.adSpend,
          orders: this.data.orders
        },
        calcResults: {
          breakEvenRoi: this.data.breakEvenRoi,
          actualRoi: this.data.actualRoi,
          netProfit: this.data.netProfit,
          profitMargin: this.data.profitMargin
        },
        aiDiagnosis: diagnosisText
      };
      
      const historyList = wx.getStorageSync('calc_history') || [];
      historyList.push(historyItem);
      // 限制最多保存 最近 200 条，与我的页面统计相匹配
      if (historyList.length > 200) {
        historyList.shift();
      }
      wx.setStorageSync('calc_history', historyList);
    } catch (e) {
      console.error("保存历史记录失败", e);
    }
  },

  // 智能 AI 诊断接口
  getAiDiagnosis() {
    wx.showLoading({ title: 'AI 诊断计算中...' });

    const { mode, breakEvenRoi, actualRoi, netProfit, profitMargin, refundRate, logistics, cost, price, adSpend, orders, commRate, kolOrders, kolAdSpend, withdrawRate, quickRefundRate, platformRate } = this.data;
    const USE_CLOUD = true; 

    // 构建适配不同模式的 Prompt
    let prompt = '';
    if (mode === 'kol') {
      prompt = `
        你是一位资深的电商达人带货投流顾问。
        请根据以下达人带货投流数据，提供一份简明扼要（150字以内）的"带货投流建议"：
        
        商品售价: ${price} 元
        佣金比例: ${commRate}%
        提现费率: ${withdrawRate}%
        1h退款率: ${quickRefundRate}%
        广告花费: ${kolAdSpend} 元
        预估出单量: ${kolOrders} 单
        实际综合 ROI (GMV ROI): ${actualRoi} (目标保本 ROI: ${breakEvenRoi})
        带货净收益: ${netProfit} 元
      `;
    } else {
      prompt = `
        你是一位资深的电商投流专家和精细化运营顾问。
        请根据以下商家的投流财务数据，提供一份简明扼要（150字以内）的“降本增效诊断书”：
        
        商品售价: ${price} 元
        进货成本: ${cost} 元
        物流包装费: ${logistics} 元
        平台扣点率: ${platformRate}%
        预估退货率: ${refundRate}%
        广告花费: ${adSpend} 元
        实际综合 ROI: ${actualRoi} (目标保本 ROI: ${breakEvenRoi})
        预估净利润: ${netProfit} 元
      `;
    }

    if (wx.cloud && USE_CLOUD) {
      const cloudCall = wx.cloud.callFunction({
        name: 'aiDiagnostic',
        data: {
          inputData: mode === 'kol' ? { price, commRate, kolOrders, kolAdSpend } : { price, cost, logistics, platformRate, refundRate, adSpend, orders },
          calcResults: { breakEvenRoi, actualRoi, netProfit, profitMargin }
        }
      });

      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('云开发调用超时')), 6000);
      });

      Promise.race([cloudCall, timeout])
        .then(res => {
          wx.hideLoading();
          if (res.result && res.result.success && !res.result.error) {
            const diag = res.result.diagnosis;
            this.setData({ aiDiagnosis: diag });
            this.saveToHistory(diag);
          } else {
            console.warn("云开发 AI 返回异常，已切换为本地高仿真诊断算法:", res ? res.result : '无返回');
            this.runOfflineDiagnosis();
          }
        }).catch(err => {
          wx.hideLoading();
          console.log("云函数调用失败或超时，已激活本地高仿真诊断算法:", err);
          this.runOfflineDiagnosis();
        });
    } else {
      wx.hideLoading();
      this.runOfflineDiagnosis();
    }
  },

  // 本地高仿真诊断算法 (适配达人与商家)
  runOfflineDiagnosis() {
    const { mode, breakEvenRoi, actualRoi, netProfit, profitMargin, refundRate, logistics, cost, price, commRate, kolAdSpend, withdrawRate, quickRefundRate } = this.data;
    let suggestion = '';

    if (mode === 'kol') {
      if (actualRoi !== '∞' && actualRoi !== '--' && parseFloat(actualRoi) < parseFloat(breakEvenRoi)) {
        suggestion = `❌ 【当前亏损诊断】您的实际综合 ROI (${actualRoi}) 低于达人带货的保本底线 (${breakEvenRoi})。广告花费 (${kolAdSpend}元) 偏高，当前佣金率 (${commRate}%)、提现费率 (${withdrawRate}%)、1h退款率 (${quickRefundRate}%) 综合导致收益不足。建议：1. 与商家沟通提升佣金率；2. 精细化投放，降低获客成本。`;
      } else {
        suggestion = `✅ 【健康盈利诊断】带货表现优异！当前综合收益率达到 ${profitMargin}%，处于健康盈利区间。建议：可以在当前素材池中增加同类型素材，适当追加 10%-15% 的广告预算以拉高出单量。`;
      }
    } else {
      if (actualRoi !== '∞' && actualRoi !== '--' && parseFloat(actualRoi) < parseFloat(breakEvenRoi)) {
        suggestion = `❌ 【当前亏损诊断】您的实际综合 ROI (${actualRoi}) 低于保本底线 (${breakEvenRoi})。主要是因为：当前退货率 (${refundRate}%) 与进货成本占售价比例 (${((parseFloat(cost)/parseFloat(price))*100).toFixed(0)}%) 挤压了利润空间。建议：1. 提升客单价降低单件物流费占比；2. 优化投放素材拉高 ROI。`;
      } else if (parseFloat(netProfit) > 0) {
        const logisticsVal = parseFloat(logistics) || 0;
        const logisticsText = logisticsVal > 3 
          ? `同时使用聚合物流将单均邮费降至3元以下，利润可再升8%！`
          : `当前单均邮费已控制在健康水平（${logisticsVal}元）。建议继续通过提升详情页转化率或老客户留存来拉高利润！`;
        
        suggestion = `✅ 【健康盈利诊断】非常棒！当前处于盈利状态。保本 ROI 仅为 ${breakEvenRoi}。商品毛利率达 ${(((parseFloat(price)-parseFloat(cost))/parseFloat(price))*100).toFixed(0)}%。优化方向：建议尝试加大广告预算，${logisticsText}`;
      } else {
        suggestion = `⚠️ 【数据不足/微利诊断】数据表现较为单薄，利润点偏低。建议优化详情页或主图，降低当前的退货率 (${refundRate}%)；同时通过高转化文案，降低目前的广告获客成本。`;
      }
    }

    this.setData({ aiDiagnosis: suggestion });
    this.saveToHistory(suggestion);
  },

  // 1. 转发给朋友
  onShareAppMessage() {
    return {
      title: '📊 电商投流 ROI 计算器 - 实时核算与智能 AI 诊断',
      path: '/pages/index/index'
    }
  },

  // 2. 分享到朋友圈
  onShareTimeline() {
    return {
      title: '📊 电商投流 ROI 计算器 - 实时核算与智能 AI 诊断'
    }
  }
});
