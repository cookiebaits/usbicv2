import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/database";
import Settings from '@/models/Settings';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const settings = Settings.findOne();
    
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    const response = NextResponse.json({
      logoUrl: settings.logoUrl,
      logoWidth: settings.logoWidth || 0,
      logoHeight: settings.logoHeight || 0,
      facebookUrl: settings.facebookUrl,
      twitterUrl: settings.twitterUrl,
      instagramUrl: settings.instagramUrl,
      zelleLogoUrl: settings.zelleLogoUrl,
      zelleLogoWidth: settings.zelleLogoWidth || 0,
      zelleLogoHeight: settings.zelleLogoHeight || 0,
      twofaLogoUrl: settings.twofaLogoUrl,
      twofaLogoWidth: settings.twofaLogoWidth || 0,
      twofaLogoHeight: settings.twofaLogoHeight || 0,
    });
    
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
