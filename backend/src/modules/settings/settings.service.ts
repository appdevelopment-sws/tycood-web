import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './entities/system-setting.entity.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingRepo: Repository<SystemSetting>,
  ) {}

  async getAllSettings(includeSecrets = false) {
    const list = await this.settingRepo.find({
      order: { category: 'ASC', key: 'ASC' },
    });

    const settingsMap: Record<string, any> = {};
    for (const item of list) {
      let val = item.value;
      if (item.isSecret && !includeSecrets && val) {
        val = val.length > 8 ? `${val.slice(0, 4)}••••••••${val.slice(-4)}` : '••••••••';
      }
      settingsMap[item.key] = {
        key: item.key,
        value: val,
        rawHasValue: Boolean(item.value),
        category: item.category,
        description: item.description,
        isSecret: item.isSecret,
        updatedAt: item.updatedAt,
      };
    }
    return {
      settings: settingsMap,
      rawList: list.map((item) => ({
        ...item,
        value:
          item.isSecret && !includeSecrets && item.value
            ? item.value.length > 8
              ? `${item.value.slice(0, 4)}••••••••${item.value.slice(-4)}`
              : '••••••••'
            : item.value,
      })),
    };
  }

  async getSetting(key: string, rawSecret = false): Promise<string | null> {
    const item = await this.settingRepo.findOne({ where: { key } });
    if (!item) return null;
    return item.value;
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const entries = Object.entries(dto.settings);
    const updated: SystemSetting[] = [];

    for (const [key, value] of entries) {
      if (value === undefined) continue;

      let setting = await this.settingRepo.findOne({ where: { key } });
      if (!setting) {
        setting = this.settingRepo.create({
          key,
          value: String(value),
          category: this.inferCategory(key),
          isSecret: this.inferIsSecret(key),
        });
      } else {
        // If it's a masked string submitted back, do not overwrite existing real secret
        if (setting.isSecret && String(value).includes('••••')) {
          continue;
        }
        setting.value = String(value);
      }
      await this.settingRepo.save(setting);
      updated.push(setting);
    }

    return this.getAllSettings(false);
  }

  private inferCategory(key: string): string {
    const k = key.toUpperCase();
    if (k.includes('MAPS') || k.includes('GEO') || k.includes('LOCATION'))
      return 'MAPS_LOCATION';
    if (k.includes('PAY') || k.includes('STRIPE') || k.includes('RAZORPAY'))
      return 'PAYMENT_GATEWAY';
    if (k.includes('SMS') || k.includes('TWILIO') || k.includes('FCM') || k.includes('NOTIF'))
      return 'NOTIFICATIONS';
    if (k.includes('S3') || k.includes('AWS') || k.includes('STORAGE') || k.includes('R2'))
      return 'CLOUD_STORAGE';
    return 'GENERAL';
  }

  private inferIsSecret(key: string): boolean {
    const k = key.toUpperCase();
    return (
      k.includes('SECRET') ||
      k.includes('TOKEN') ||
      k.includes('PASSWORD') ||
      k.includes('PRIVATE') ||
      k.includes('API_KEY')
    );
  }

  async seedDefaultSettings() {
    const defaults = [
      // Maps & Navigation
      {
        key: 'GOOGLE_MAPS_API_KEY',
        value: '',
        category: 'MAPS_LOCATION',
        description: 'Google Maps JavaScript API & Distance Matrix Key',
        isSecret: true,
      },
      {
        key: 'MAPBOX_ACCESS_TOKEN',
        value: '',
        category: 'MAPS_LOCATION',
        description: 'Mapbox Navigation SDK token for driver turn-by-turn routing',
        isSecret: true,
      },

      // Payment Gateways
      {
        key: 'RAZORPAY_KEY_ID',
        value: '',
        category: 'PAYMENT_GATEWAY',
        description: 'Razorpay Public Merchant Key ID',
        isSecret: false,
      },
      {
        key: 'RAZORPAY_KEY_SECRET',
        value: '',
        category: 'PAYMENT_GATEWAY',
        description: 'Razorpay Merchant Secret Key',
        isSecret: true,
      },
      {
        key: 'STRIPE_PUBLISHABLE_KEY',
        value: '',
        category: 'PAYMENT_GATEWAY',
        description: 'Stripe Publishable Key for card checkout',
        isSecret: false,
      },
      {
        key: 'STRIPE_SECRET_KEY',
        value: '',
        category: 'PAYMENT_GATEWAY',
        description: 'Stripe Secret Key for server charges & refunds',
        isSecret: true,
      },

      // Notifications & SMS
      {
        key: 'TWILIO_ACCOUNT_SID',
        value: '',
        category: 'NOTIFICATIONS',
        description: 'Twilio Account SID for sending rider OTP SMS',
        isSecret: false,
      },
      {
        key: 'TWILIO_AUTH_TOKEN',
        value: '',
        category: 'NOTIFICATIONS',
        description: 'Twilio Authentication Token',
        isSecret: true,
      },
      {
        key: 'TWILIO_SENDER_NUMBER',
        value: '',
        category: 'NOTIFICATIONS',
        description: 'Twilio Registered Phone Number / Alphanumeric Sender ID',
        isSecret: false,
      },
      {
        key: 'FIREBASE_SERVER_KEY',
        value: '',
        category: 'NOTIFICATIONS',
        description: 'FCM Server Key for mobile push notifications',
        isSecret: true,
      },

      // Cloud Storage
      {
        key: 'S3_BUCKET_NAME',
        value: 'cab-booking-storage',
        category: 'CLOUD_STORAGE',
        description: 'AWS S3 or Cloudflare R2 bucket name for driver KYC & car photos',
        isSecret: false,
      },
      {
        key: 'S3_REGION',
        value: 'ap-south-1',
        category: 'CLOUD_STORAGE',
        description: 'AWS S3 bucket region',
        isSecret: false,
      },
      {
        key: 'S3_ACCESS_KEY',
        value: '',
        category: 'CLOUD_STORAGE',
        description: 'Cloud storage IAM Access Key ID',
        isSecret: true,
      },
      {
        key: 'S3_SECRET_KEY',
        value: '',
        category: 'CLOUD_STORAGE',
        description: 'Cloud storage IAM Secret Access Key',
        isSecret: true,
      },

      // General System Config
      {
        key: 'PLATFORM_CURRENCY',
        value: 'INR',
        category: 'GENERAL',
        description: 'Default platform currency ISO 4217 code (e.g. INR, USD, EUR)',
        isSecret: false,
      },
      {
        key: 'PLATFORM_BASE_FEE',
        value: '49',
        category: 'GENERAL',
        description: 'Platform facilitation service fee charged per ride',
        isSecret: false,
      },
      {
        key: 'AUTO_DISPATCH_RADIUS_KM',
        value: '5',
        category: 'GENERAL',
        description: 'Maximum search radius in kilometers for auto-dispatching nearby drivers',
        isSecret: false,
      },
      {
        key: 'DRIVER_ACCEPT_TIMEOUT_SEC',
        value: '45',
        category: 'GENERAL',
        description: 'Seconds a driver has to accept or decline an incoming trip dispatch',
        isSecret: false,
      },
      {
        key: 'RIDE_CANCEL_GRACE_MINUTES',
        value: '5',
        category: 'GENERAL',
        description: 'Free cancellation window for passenger before cancellation penalty applies',
        isSecret: false,
      },
      {
        key: 'SUPPORT_EMAIL',
        value: 'support@cabbooking.com',
        category: 'GENERAL',
        description: 'Official customer support email shown in rider receipt & app',
        isSecret: false,
      },
      {
        key: 'EMERGENCY_SOS_PHONE',
        value: '112',
        category: 'GENERAL',
        description: 'Emergency national or city SOS police helpline dialed on SOS tap',
        isSecret: false,
      },
    ];

    for (const item of defaults) {
      const exists = await this.settingRepo.findOne({ where: { key: item.key } });
      if (!exists) {
        const entity = this.settingRepo.create(item);
        await this.settingRepo.save(entity);
      }
    }
  }
}
