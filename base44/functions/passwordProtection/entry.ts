import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Simple base64 helpers
function base64Encode(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function base64Decode(str) {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

// Hash password with SHA-256 (simplified for demo, use bcrypt in production)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// XOR encryption for file content
function encryptContent(content, password) {
  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(content);
  const passwordBytes = encoder.encode(password);
  const encrypted = [];
  
  for (let i = 0; i < contentBytes.length; i++) {
    encrypted.push(contentBytes[i] ^ passwordBytes[i % passwordBytes.length]);
  }
  
  return base64Encode(new Uint8Array(encrypted));
}

function decryptContent(encryptedBase64, password) {
  try {
    const encrypted = base64Decode(encryptedBase64);
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);
    const decrypted = [];
    
    for (let i = 0; i < encrypted.length; i++) {
      decrypted.push(encrypted[i] ^ passwordBytes[i % passwordBytes.length]);
    }
    
    const decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(decrypted));
  } catch {
    throw new Error('Decryption failed - wrong password or corrupted data');
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { action, password, content, filePath, workspaceName } = payload;

    if (action === 'hash') {
      // Hash a password for storage
      const passwordHash = await hashPassword(password);
      return Response.json({ hash: passwordHash.substring(0, 32) });
    }

    if (action === 'encrypt') {
      // Encrypt file content
      if (!password || !content) {
        return Response.json({ error: 'Missing password or content' }, { status: 400 });
      }
      const encrypted = encryptContent(content, password);
      const passwordHash = await hashPassword(password);
      return Response.json({ 
        encrypted,
        hash: passwordHash.substring(0, 32),
        metadata: {
          filePath,
          encryptedAt: new Date().toISOString(),
          encryptedBy: user.email,
          size: content.length
        }
      });
    }

    if (action === 'decrypt') {
      // Decrypt file content (requires correct password)
      if (!password || !content) {
        return Response.json({ error: 'Missing password or encrypted content' }, { status: 400 });
      }
      try {
        const decrypted = decryptContent(content, password);
        return Response.json({ decrypted });
      } catch (e) {
        return Response.json({ error: e.message }, { status: 403 });
      }
    }

    if (action === 'protectWorkspace') {
      // Mark workspace as password protected
      const hash = await hashPassword(password);
      return Response.json({
        workspaceName,
        protected: true,
        hash: hash.substring(0, 32),
        protectedAt: new Date().toISOString(),
        protectedBy: user.email
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('Password protection error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});