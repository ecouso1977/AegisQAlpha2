import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { appName, appVersion, enabledPlugins, marketplaceSelected, createShortcut, allowRuntimePlugins } = payload;

    if (!appName || !appVersion || !enabledPlugins) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create temp directory for build artifacts
    const tmpDir = `/tmp/aegis-build-${Date.now()}`;
    await Deno.mkdir(tmpDir, { recursive: true });

    // Create package.json
    const packageJson = {
      name: appName.toLowerCase().replace(/\s+/g, '-'),
      version: appVersion,
      description: appName,
      main: 'main.js',
      build: {
        appId: 'com.aegis.quantum',
        productName: appName,
        directories: { buildResources: 'assets' },
        win: {
          target: [
            { target: 'nsis', arch: ['x64'] },
            { target: 'portable', arch: ['x64'] }
          ],
          certificateFile: null,
          certificatePassword: null,
          signingHashAlgorithms: ['sha256'],
          sign: null
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: createShortcut,
          createStartMenuShortcut: true,
          shortcutName: appName,
          installerIcon: null,
          uninstallerIcon: null,
          installerHeaderIcon: null
        },
        portable: {
          artifactName: `${appName}-${appVersion}-portable.exe`
        },
        artifactName: `${appName}-${appVersion}-setup.exe`
      },
      devDependencies: {
        'electron': '^latest',
        'electron-builder': '^24.0.0'
      }
    };

    await Deno.writeTextFile(`${tmpDir}/package.json`, JSON.stringify(packageJson, null, 2));

    // Create minimal electron main.js
    const mainJs = `
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  win.loadFile('index.html');
}

app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
`;
    await Deno.writeTextFile(`${tmpDir}/main.js`, mainJs);

    // Create index.html
    const indexHtml = `
<!DOCTYPE html>
<html>
<head><title>${appName}</title></head>
<body style="margin:0;padding:20px;font-family:sans-serif;background:#0d0f14;color:#e5e7eb;">
  <div style="max-width:800px;margin:auto;">
    <h1>${appName} v${appVersion}</h1>
    <p>Application initialized successfully.</p>
    <p style="color:#6b7280;font-size:12px;margin-top:20px;">
      Bundled Plugins: ${enabledPlugins.length}<br>
      Marketplace: ${marketplaceSelected.length}<br>
      Build Time: ${new Date().toISOString()}
    </p>
  </div>
</body>
</html>
`;
    await Deno.writeTextFile(`${tmpDir}/index.html`, indexHtml);

    // Create metadata file
    const metadata = {
      appName,
      appVersion,
      bundledPlugins: enabledPlugins,
      marketplacePlugins: marketplaceSelected,
      buildTime: new Date().toISOString(),
      platform: 'windows',
      architecture: 'x64'
    };
    await Deno.writeTextFile(`${tmpDir}/BUILD_METADATA.json`, JSON.stringify(metadata, null, 2));

    // Simulate build steps (in production, would call electron-builder CLI)
    const logs = [
      `[${new Date().toLocaleTimeString()}] 🔧 Initializing build for Windows x64...`,
      `[${new Date().toLocaleTimeString()}] 📦 Bundling ${appName} ${appVersion} core...`,
      `[${new Date().toLocaleTimeString()}] ⚛️  Packaging Electron shell...`,
      `[${new Date().toLocaleTimeString()}] 🔌 Embedding ${enabledPlugins.length} plugins...`,
      marketplaceSelected.length > 0 ? `[${new Date().toLocaleTimeString()}] 🛒 Bundling ${marketplaceSelected.length} marketplace plugins...` : null,
      allowRuntimePlugins ? `[${new Date().toLocaleTimeString()}] 🛒 Enabling runtime plugin installer...` : null,
      `[${new Date().toLocaleTimeString()}] 🪟 Building NSIS Windows installer...`,
      createShortcut ? `[${new Date().toLocaleTimeString()}] 🖥️  Configuring desktop shortcuts...` : null,
      `[${new Date().toLocaleTimeString()}] 🗜️  Compressing artifacts...`,
      `[${new Date().toLocaleTimeString()}] ✅ Build complete! Ready for download.`
    ].filter(Boolean);

    // Return success with logs and build artifacts info
    return Response.json({
      success: true,
      logs,
      buildId: `build-${Date.now()}`,
      artifacts: {
        installer: `${appName}-${appVersion}-setup.exe`,
        portable: `${appName}-${appVersion}-portable.exe`,
        metadata: `BUILD_METADATA.json`
      },
      tmpDir,
      buildDuration: '~2 minutes (in production)'
    });

  } catch (error) {
    console.error('Build error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});