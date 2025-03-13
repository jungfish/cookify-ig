import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const existingRecipe = await prisma.recipe.findFirst({
      where: { url }
    });

    return NextResponse.json(existingRecipe || null);
    
  } catch (error) {
    console.error('Error checking recipe:', error);
    return NextResponse.json(
      { error: 'Failed to check recipe' },
      { status: 500 }
    );
  }
} 