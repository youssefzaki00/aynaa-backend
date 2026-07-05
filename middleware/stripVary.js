// Remove Vary (often Vary: Origin from the cors package) so Cloudflare can cache
// cacheable GET list responses. Apply only on public list/sync routes — not globally.
const stripVaryHeader = (req, res, next) => {
  const json = res.json.bind(res);
  res.json = (body) => {
    res.removeHeader("Vary");
    return json(body);
  };
  next();
};

module.exports = stripVaryHeader;
