import bcrypt from 'bcrypt';

async function test() {
  const senha = 'senha123';
  const hash = '$2b$10$Xt5/dSc6xBHa/r9b0h/3ieflh/XKaJR9kkQSCMAGnB36YMDyZBnrO';
  
  // Teste com hash existente
  console.log('Senha:', senha);
  console.log('Hash armazenado:', hash);
  const isMatch = await bcrypt.compare(senha, hash);
  console.log('Resultado da comparação:', isMatch);
  
  // Gerar novo hash e comparar
  const novoHash = await bcrypt.hash(senha, 10);
  console.log('Novo hash gerado:', novoHash);
  const novaComparação = await bcrypt.compare(senha, novoHash);
  console.log('Resultado da nova comparação:', novaComparação);
}

test().catch(console.error);