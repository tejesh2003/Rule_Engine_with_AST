const Rule = require('../models/Rule');
const { parseRuleString, combineNodes, evaluate, printTree } = require('../utils/ast');

function generateRandomLetterString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charactersLength);
      result += characters.charAt(randomIndex);
  }

  return result;
}

exports.createRule = async (req, res) => {
  try {
    const { ruleName, ruleString } = req.body;
    if (!ruleName || !ruleString) {
      return res.status(400).json({ error: 'ruleName and ruleString are required' });
    }
    const rootNode = parseRuleString(ruleString);
    const rule = new Rule({ ruleName, ruleAST: rootNode });
    await rule.save();
    printTree(rootNode);
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.combineRules = async (req, res) => {
  try {
    const { rules, op } = req.body;
    const ruleDocs = await Rule.find({ ruleName: { $in: rules } });
    if (ruleDocs.length === 0) {
      return res.status(404).json({ error: 'No matching rules found' });
    }
    const ruleASTs = ruleDocs.map(rule => rule.ruleAST);
    const combinedRootNode = combineNodes(ruleASTs, op);
    const randomString = generateRandomLetterString(4);
    const rule = new Rule({ ruleName: `combined${randomString}`, ruleAST: combinedRootNode });
    await rule.save();
    printTree(combinedRootNode);
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.evaluateRule = async (req, res) => {
  try {
    const { ast, data } = req.body;
    const rule = await Rule.findOne({ ruleName: ast }); // Use findOne to fetch a single rule

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const result = evaluate(rule.ruleAST, data); // Access ruleAST directly from the rule object
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.fetchRules = async (req, res) => {
  try {
      // Fetch only the ruleName field
      const rules = await Rule.find().select('ruleName');
      res.status(200).json(rules);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};


