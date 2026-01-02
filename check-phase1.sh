#!/bin/bash
# Script de verificação rápida - Fase 1 Firebase Auth Setup

set -e

echo "🔍 Verificação Rápida - Fase 1 Firebase Auth"
echo "=============================================="
echo ""

# 1. Verificar arquivos criados
echo "1️⃣  Verificando arquivos criados..."
files_to_check=(
  "server/firebaseAdmin.ts"
  "server/firebaseAuth.ts"
  "client/src/lib/firebase.ts"
  "PHASE_1_FIREBASE_AUTH_SETUP.md"
  "PHASE_1_COMPLETE.md"
  "FASE_1_RESUMO.md"
  ".env.example"
)

for file in "${files_to_check[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ FALTA: $file"
  fi
done

echo ""

# 2. Verificar dependências instaladas
echo "2️⃣  Verificando dependências npm..."
if grep -q "firebase-admin" package.json; then
  echo "  ✅ firebase-admin instalado"
else
  echo "  ❌ firebase-admin NÃO instalado"
  echo "     Execute: npm install firebase-admin"
fi

if grep -q '"firebase"' package.json; then
  echo "  ✅ firebase SDK instalado"
else
  echo "  ❌ firebase SDK NÃO instalado"
fi

echo ""

# 3. Verificar importações em routes.ts
echo "3️⃣  Verificando importações em server/routes.ts..."
if grep -q "firebaseAuthMiddleware" server/routes.ts; then
  echo "  ✅ firebaseAuthMiddleware importado"
else
  echo "  ❌ firebaseAuthMiddleware NÃO importado"
fi

if grep -q "firebase-login" server/routes.ts; then
  echo "  ✅ Endpoint /api/auth/firebase-login adicionado"
else
  echo "  ❌ Endpoint firebase-login NÃO adicionado"
fi

echo ""

# 4. Verificar importação em index.ts
echo "4️⃣  Verificando inicialização em server/index.ts..."
if grep -q "initializeFirebase" server/index.ts; then
  echo "  ✅ Firebase inicializado no server/index.ts"
else
  echo "  ❌ Firebase NÃO inicializado"
fi

echo ""

# 5. Verificar contexto de auth refatorado
echo "5️⃣  Verificando client/src/context/auth-context.tsx..."
if grep -q "firebaseUser" client/src/context/auth-context.tsx; then
  echo "  ✅ Contexto refatorado para Firebase"
else
  echo "  ❌ Contexto NÃO refatorado"
fi

if grep -q "onAuthStateChange" client/src/context/auth-context.tsx; then
  echo "  ✅ Observer onAuthStateChange implementado"
else
  echo "  ❌ Observer NÃO implementado"
fi

echo ""

# 6. Verificar linhas de código adicionadas
echo "6️⃣  Estatísticas de código..."
firebase_admin_lines=$(wc -l < server/firebaseAdmin.ts 2>/dev/null || echo "0")
firebase_auth_lines=$(wc -l < server/firebaseAuth.ts 2>/dev/null || echo "0")
firebase_client_lines=$(wc -l < client/src/lib/firebase.ts 2>/dev/null || echo "0")
echo "  • server/firebaseAdmin.ts: $firebase_admin_lines linhas"
echo "  • server/firebaseAuth.ts: $firebase_auth_lines linhas"
echo "  • client/src/lib/firebase.ts: $firebase_client_lines linhas"

echo ""

# 7. Verificar variáveis de ambiente
echo "7️⃣  Verificando variáveis de ambiente..."
if [ -z "$SERVICE_ACCOUNT_KEY" ]; then
  echo "  ⚠️  SERVICE_ACCOUNT_KEY não setada"
  echo "     Execute: export SERVICE_ACCOUNT_KEY='...'"
else
  echo "  ✅ SERVICE_ACCOUNT_KEY definida"
fi

if [ -f ".env.local" ]; then
  if grep -q "VITE_FIREBASE_API_KEY" .env.local; then
    echo "  ✅ .env.local com Firebase credentials"
  else
    echo "  ⚠️  .env.local sem VITE_FIREBASE_API_KEY"
  fi
else
  echo "  ⚠️  .env.local não encontrado"
  echo "     Criar a partir de .env.example"
fi

echo ""

# 8. Verificar sintaxe TypeScript (opcional)
echo "8️⃣  Verificando sintaxe TypeScript..."
if command -v tsc &> /dev/null; then
  if tsc --noEmit server/firebaseAdmin.ts 2>/dev/null; then
    echo "  ✅ server/firebaseAdmin.ts - OK"
  else
    echo "  ⚠️  server/firebaseAdmin.ts - Possíveis erros"
  fi
else
  echo "  ⏭️  TypeScript não disponível, pulando"
fi

echo ""
echo "=============================================="
echo "✅ Verificação Concluída!"
echo ""
echo "📋 Próximos passos:"
echo "  1. Definir SERVICE_ACCOUNT_KEY:"
echo "     export SERVICE_ACCOUNT_KEY='...'"
echo ""
echo "  2. Criar .env.local com credenciais Firebase:"
echo "     cp .env.example .env.local"
echo "     # Editar .env.local com valores reais"
echo ""
echo "  3. Iniciar servidor:"
echo "     npm run dev"
echo ""
echo "  4. Testar login em http://localhost:5000"
echo ""
echo "📚 Documentação:"
echo "  • FASE_1_RESUMO.md - Resumo executivo"
echo "  • PHASE_1_FIREBASE_AUTH_SETUP.md - Setup detalhado"
echo "  • PHASE_1_COMPLETE.md - Detalhes técnicos"
echo ""
