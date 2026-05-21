const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { inputData, calcResults } = event;

  let prompt = '';
  if (inputData.commRate !== undefined) {
    // 达人带货模式
    prompt = `
      你是一位资深的电商达人带货投流顾问。
      请根据以下达人带货投流数据，提供一份简明扼要（150字以内）的“带货投流建议”：
      
      商品售价: ${inputData.price} 元
      佣金比例: ${inputData.commRate}%
      广告花费: ${inputData.kolAdSpend} 元
      预估出单量: ${inputData.kolOrders} 单
      实际综合 ROI (GMV ROI): ${calcResults.actualRoi} (目标保本 ROI: ${calcResults.breakEvenRoi})
      带货净收益: ${calcResults.netProfit} 元
    `;
  } else {
    // 商家自营模式
    prompt = `
      你是一位资深的电商投流专家和精细化运营顾问。
      请根据以下商家的投流财务数据，提供一份简明扼要（150字以内）的“降本增效诊断书”：
      
      商品售价: ${inputData.price} 元
      进货成本: ${inputData.cost} 元
      物流包装费: ${inputData.logistics} 元
      平台扣点率: ${inputData.platformRate}%
      预估退货率: ${inputData.refundRate}%
      广告花费: ${inputData.adSpend} 元
      实际综合 ROI: ${calcResults.actualRoi} (目标保本 ROI: ${calcResults.breakEvenRoi})
      预估净利润: ${calcResults.netProfit} 元
    `;
  }

  try {
    // 调用微信云开发内置的免费混元大模型接口
    const res = await cloud.openapi.hunyuan.chatCompletions({
      model: 'hunyuan-lite', // 使用免费赠送额度的模型
      messages: [{ role: 'user', content: prompt }]
    });

    return {
      success: true,
      diagnosis: res.choices[0].message.content
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || err
    };
  }
}
