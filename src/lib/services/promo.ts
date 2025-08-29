export interface PromoConfig {
  name: string;
  smsCredits: number;
  emailCredits: number;
  description: string;
  validUntil: string;
  active: boolean;
  backgroundColor: string;
  iconColor: string;
}

export class PromoService {
  static getActivePromo(): PromoConfig | null {
    const name = process.env.NEXT_PUBLIC_ACTIVE_PROMO_NAME;
    const smsCredits = parseInt(process.env.NEXT_PUBLIC_ACTIVE_PROMO_SMS_CREDITS || '0');
    const emailCredits = parseInt(process.env.NEXT_PUBLIC_ACTIVE_PROMO_EMAIL_CREDITS || '0');
    const description = process.env.NEXT_PUBLIC_ACTIVE_PROMO_DESCRIPTION || '';
    const validUntil = process.env.NEXT_PUBLIC_ACTIVE_PROMO_VALID_UNTIL || '';
    const active = process.env.NEXT_PUBLIC_ACTIVE_PROMO_ACTIVE === 'true';
    const backgroundColor = process.env.NEXT_PUBLIC_ACTIVE_PROMO_BACKGROUND_COLOR || 'from-purple-500 to-pink-600';
    const iconColor = process.env.NEXT_PUBLIC_ACTIVE_PROMO_ICON_COLOR || 'purple-400';
    
    console.log('🔍 Promo environment variables:', {
      name,
      smsCredits,
      emailCredits,
      description,
      validUntil,
      active,
      backgroundColor,
      iconColor
    });
    
    if (!name || !active) {
      console.log('⚠️ Promo not active - name:', name, 'active:', active);
      return null;
    }
    
    return {
      name,
      smsCredits,
      emailCredits,
      description,
      validUntil,
      active,
      backgroundColor,
      iconColor
    };
  }
  
  static isPromoValid(): boolean {
    const config = this.getActivePromo();
    if (!config) return false;
    
    const now = new Date();
    const validUntil = new Date(config.validUntil);
    
    return now <= validUntil;
  }
  
  static getTotalCredits(): number {
    const config = this.getActivePromo();
    if (!config) {
      console.log('⚠️ No active promo config found');
      return 0;
    }
    
    const total = config.smsCredits + config.emailCredits;
    console.log('🎁 Promo credits - SMS:', config.smsCredits, 'Email:', config.emailCredits, 'Total:', total);
    return total;
  }
}
