const cloud = require('wx-server-sdk')
const cloudbase = require('@cloudbase/node-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const app = cloudbase.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const ai = app.ai()

exports.main = async (event, context) => {
  const { inputData, calcResults } = event;

  let prompt = '';
  if (inputData.commRate !== undefined) {
    // 达人带货模式
    prompt = `
      你是一位资深的电商达人带货投流顾问。
      请根据以下达人带货投流数据，提供一份简明扼要（150字以内）的“带货投流建议”：
      注意：请直接输出纯文本，请勿包含 Markdown 格式字符（例如千万不要使用双星号 ** 包裹文本，也不要使用 # 等标记）：
      
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
      注意：请直接输出纯文本，请勿包含 Markdown 格式字符（例如千万不要使用双星号 ** 包裹文本，也不要使用 # 等标记）：
      
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
    let result;
    try {
      // 优先使用标准传入 provider 和 model 的方式
      result = await ai.generateText({
        provider: "hunyuan-v3",
        model: "hy3-preview",
        messages: [{ role: "user", content: prompt }]
      });
    } catch (e1) {
      console.warn("ai.generateText failed, trying model.generateText:", e1);
      // 备选方式：创建服务提供商后生成文本
      const model = ai.createModel("hunyuan-v3");
      result = await model.generateText({
        model: "hy3-preview",
        messages: [{ role: "user", content: prompt }]
      });
    }

    if (!result || !result.text) {
      throw new Error("AI 诊断返回内容为空");
    }

    return {
      success: true,
      diagnosis: result.text
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || err
    };
  }
}
