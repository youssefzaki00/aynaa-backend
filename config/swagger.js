const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const swaggerDir = path.join(__dirname, '..', 'swagger');
const componentsDir = path.join(swaggerDir, 'components');

const readYaml = (filePath) =>
  yaml.load(fs.readFileSync(filePath, 'utf8'));

const collectPaths = (dir) => {
  const paths = {};

  if (!fs.existsSync(dir)) {
    return paths;
  }

  const walk = (currentDir) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!/\.ya?ml$/i.test(entry.name)) {
        continue;
      }

      const doc = readYaml(fullPath);
      if (doc.paths) {
        mergePaths(paths, doc.paths);
      } else {
        mergePaths(paths, doc);
      }
    }
  };

  walk(dir);
  return paths;
};

const mergePaths = (target, source) => {
  for (const [pathKey, methods] of Object.entries(source)) {
    target[pathKey] = { ...(target[pathKey] || {}), ...methods };
  }
};

const loadComponents = () => {
  const components = {
    schemas: {},
    parameters: {},
    responses: {},
    securitySchemes: {},
  };

  if (!fs.existsSync(componentsDir)) {
    return components;
  }

  for (const entry of fs.readdirSync(componentsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.ya?ml$/i.test(entry.name)) {
      continue;
    }

    const doc = readYaml(path.join(componentsDir, entry.name));
    for (const [key, value] of Object.entries(doc)) {
      if (components[key]) {
        Object.assign(components[key], value);
      }
    }
  }

  return components;
};

const loadSwaggerSpec = (audience) => {
  const isMobile = audience === 'mobile';
  const baseFile = isMobile ? 'openapi-mobile.yaml' : 'openapi-dashboard.yaml';
  const base = readYaml(path.join(swaggerDir, baseFile));
  const sharedComponents = loadComponents();

  base.components = base.components || {};
  base.components.schemas = {
    ...sharedComponents.schemas,
    ...base.components.schemas,
  };
  base.components.parameters = {
    ...sharedComponents.parameters,
    ...base.components.parameters,
  };
  base.components.responses = {
    ...sharedComponents.responses,
    ...base.components.responses,
  };
  base.components.securitySchemes = {
    ...base.components.securitySchemes,
    ...sharedComponents.securitySchemes,
  };

  base.paths = collectPaths(
    path.join(swaggerDir, 'paths', isMobile ? 'mobile' : 'admin'),
  );

  return base;
};

const loadMobileSwaggerSpec = () => loadSwaggerSpec('mobile');
const loadDashboardSwaggerSpec = () => loadSwaggerSpec('admin');

module.exports = {
  loadSwaggerSpec,
  loadMobileSwaggerSpec,
  loadDashboardSwaggerSpec,
};
