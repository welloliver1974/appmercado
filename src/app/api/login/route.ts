import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return NextResponse.json({ error: 'Preencha email e senha.' }, { status: 400 });
  }

  const envPassword = process.env.AUTH_PASSWORD;
  if (!envPassword || password !== envPassword) {
    return NextResponse.json({ error: 'Email ou senha inválidos.' }, { status: 401 });
  }

  try {
    const prisma = await getPrisma();
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const name = email.split('@')[0];
      user = await prisma.user.create({ data: { email, name } });
    }
    // set cookies
    const response = NextResponse.redirect(new URL('/', req.url));
    response.cookies.set('user-id', user.id, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
    response.cookies.set('user-email', user.email ?? '', { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
    return response;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Erro interno, tente novamente.' }, { status: 500 });
  }
}
