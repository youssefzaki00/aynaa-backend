const { buckets } = require("./testContext");

const cleanupTestData = async () => {
  const deletes = [];

  if (buckets.sites.length) {
    const Site = require("../../site/Site");
    deletes.push(Site.deleteMany({ _id: { $in: buckets.sites } }));
  }
  if (buckets.apps.length) {
    const App = require("../../models/App");
    deletes.push(App.deleteMany({ _id: { $in: buckets.apps } }));
  }
  if (buckets.keywords.length) {
    const Keyword = require("../../models/Keyword");
    deletes.push(Keyword.deleteMany({ _id: { $in: buckets.keywords } }));
  }
  if (buckets.categories.length) {
    const Category = require("../../models/Category");
    deletes.push(Category.deleteMany({ _id: { $in: buckets.categories } }));
  }
  if (buckets.users.length) {
    const User = require("../../models/User");
    deletes.push(User.deleteMany({ _id: { $in: buckets.users } }));
  }
  if (buckets.excludedApps.length) {
    const ExcludedApp = require("../../keywords-blocking-excluded-app/ExcludedApp");
    deletes.push(ExcludedApp.deleteMany({ _id: { $in: buckets.excludedApps } }));
  }
  if (buckets.requests.length) {
    const Request = require("../../models/Request");
    deletes.push(Request.deleteMany({ _id: { $in: buckets.requests } }));
  }
  if (buckets.whitelist.length) {
    const GlobalWhitelist = require("../../models/GlobalWhitelist");
    deletes.push(GlobalWhitelist.deleteMany({ _id: { $in: buckets.whitelist } }));
  }
  if (buckets.suggestions.length) {
    const Suggestion = require("../../models/Suggestion");
    deletes.push(Suggestion.deleteMany({ _id: { $in: buckets.suggestions } }));
  }
  if (buckets.devices.length) {
    const Device = require("../../models/Device");
    deletes.push(Device.deleteMany({ _id: { $in: buckets.devices } }));
  }

  await Promise.allSettled(deletes);

  for (const key of Object.keys(buckets)) {
    buckets[key].length = 0;
  }
};

module.exports = { cleanupTestData };
