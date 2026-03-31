/**
 * want to refactored to not send all keywords and whitelist to the client
 * instead, we can implement pull sync
 */

const Device = require('../models/Device');
const Keyword = require('../models/Keyword');
const GlobalWhitelist = require('../models/GlobalWhitelist');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Sync device and return keywords + whitelist
 * POST /api/v1/sync
 */
/**
 * Get device configuration (keywords + whitelist)
 * GET /api/v1/config
 */
const getDeviceConfig = async (req, res, next) => {
  try {
    const deviceId = req.header('deviceId') || req.query.deviceId;

    if (!deviceId) {
      return sendError(res, 400, 'Device ID is required');
    }

    // Update lastSeen and get device preferences
    // Use findOneAndUpdate to atomically update lastSeen and get the document
    let device = await Device.findOneAndUpdate(
      { deviceId },
      { lastSeen: new Date() },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Fetch all enabled keywords
    const globalKeywords = await Keyword.find({ isEnabled: true }).select('word -_id');
    const globalKeywordList = globalKeywords.map(k => k.word);

    // Fetch global whitelist
    const globalWhitelist = await GlobalWhitelist.find().select('packageName appName -_id');
    const globalWhitelistList = globalWhitelist.map(w => ({
      packageName: w.packageName,
      appName: w.appName,
    }));

    // --- Compute Effective Keywords ---
    // Use a Map to store keywords by word to handle overrides and preservation of categories
    let finalKeywordsMap = new Map();

    // Add global keywords
    globalKeywords.forEach(k => {
      finalKeywordsMap.set(k.word, { word: k.word, category: k.category });
    });

    // Add custom blocked keywords
    if (device.customBlockedKeywords && device.customBlockedKeywords.length > 0) {
      device.customBlockedKeywords.forEach(word => {
        // If it already exists (globally), this just confirms it. 
        // If not, we add it with a custom category.
        if (!finalKeywordsMap.has(word)) {
          finalKeywordsMap.set(word, { word, category: 'CUSTOM' });
        }
      });
    }

    // Remove custom allowed keywords
    if (device.customAllowedKeywords && device.customAllowedKeywords.length > 0) {
      device.customAllowedKeywords.forEach(word => {
        finalKeywordsMap.delete(word);
      });
    }

    // --- Compute Effective Whitelist ---
    // Start with global whitelist
    // We use a Map for whitelist to easily handle removals by package name
    let finalWhitelistMap = new Map();
    globalWhitelistList.forEach(app => finalWhitelistMap.set(app.packageName, app));

    // Add custom whitelisted apps
    if (device.customWhitelistedApps && device.customWhitelistedApps.length > 0) {
      device.customWhitelistedApps.forEach(pkg => {
        if (!finalWhitelistMap.has(pkg)) {
            // Default appName if not available (since we only store package name strings)
            finalWhitelistMap.set(pkg, { packageName: pkg, appName: pkg });
        }
      });
    }

    // Remove custom blacklisted apps
    if (device.customBlacklistedApps && device.customBlacklistedApps.length > 0) {
      device.customBlacklistedApps.forEach(pkg => finalWhitelistMap.delete(pkg));
    }

    sendSuccess(res, 200, 'Device configuration retrieved successfully', {
      keywords: Array.from(finalKeywordsMap.values()),
      whitelist: Array.from(finalWhitelistMap.values()),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDeviceConfig };


