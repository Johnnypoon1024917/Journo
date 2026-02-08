import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '../config';

describe('i18n Translations', () => {
  beforeEach(async () => {
    // Ensure i18n is initialized
    if (!i18n.isInitialized) {
      await i18n.init();
    }
  });

  describe('English translations', () => {
    beforeEach(() => {
      i18n.changeLanguage('en');
    });

    it('should translate common navigation items', () => {
      expect(i18n.t('kawaii:navigation.schedule')).toBe('Schedule');
      expect(i18n.t('kawaii:navigation.booking')).toBe('Booking');
      expect(i18n.t('kawaii:navigation.shopping')).toBe('Shopping');
      expect(i18n.t('kawaii:navigation.checklist')).toBe('Checklist');
      expect(i18n.t('kawaii:navigation.members')).toBe('Members');
      expect(i18n.t('kawaii:navigation.settings')).toBe('Settings');
    });

    it('should translate countdown timer', () => {
      expect(i18n.t('kawaii:countdown.days', { count: 1 })).toBe('1 day');
      expect(i18n.t('kawaii:countdown.days', { count: 5 })).toBe('5 days');
      expect(i18n.t('kawaii:countdown.hours', { count: 1 })).toBe('1 hour');
      expect(i18n.t('kawaii:countdown.hours', { count: 3 })).toBe('3 hours');
    });

    it('should translate weather conditions', () => {
      expect(i18n.t('kawaii:weather.conditions.sunny')).toBe('Sunny');
      expect(i18n.t('kawaii:weather.conditions.rainy')).toBe('Rainy');
      expect(i18n.t('kawaii:weather.conditions.snowy')).toBe('Snowy');
    });

    it('should translate theme colors', () => {
      expect(i18n.t('kawaii:theme.colors.pink')).toBe('Pink');
      expect(i18n.t('kawaii:theme.colors.orange')).toBe('Orange');
      expect(i18n.t('kawaii:theme.colors.blue')).toBe('Blue');
    });

    it('should translate animation types', () => {
      expect(i18n.t('kawaii:theme.animationTypes.none')).toBe('None');
      expect(i18n.t('kawaii:theme.animationTypes.snow')).toBe('Snow');
      expect(i18n.t('kawaii:theme.animationTypes.sakura')).toBe('Sakura');
    });
  });

  describe('Traditional Chinese translations', () => {
    beforeEach(() => {
      i18n.changeLanguage('zh-TW');
    });

    it('should translate common navigation items', () => {
      expect(i18n.t('kawaii:navigation.schedule')).toBe('行程');
      expect(i18n.t('kawaii:navigation.booking')).toBe('預約');
      expect(i18n.t('kawaii:navigation.shopping')).toBe('購物');
      expect(i18n.t('kawaii:navigation.checklist')).toBe('準備');
      expect(i18n.t('kawaii:navigation.members')).toBe('成員');
      expect(i18n.t('kawaii:navigation.settings')).toBe('設置');
    });

    it('should translate countdown timer', () => {
      expect(i18n.t('kawaii:countdown.days', { count: 1 })).toBe('1 天');
      expect(i18n.t('kawaii:countdown.days', { count: 5 })).toBe('5 天');
      expect(i18n.t('kawaii:countdown.hours', { count: 1 })).toBe('1 小時');
      expect(i18n.t('kawaii:countdown.hours', { count: 3 })).toBe('3 小時');
    });

    it('should translate weather conditions', () => {
      expect(i18n.t('kawaii:weather.conditions.sunny')).toBe('晴天');
      expect(i18n.t('kawaii:weather.conditions.rainy')).toBe('下雨');
      expect(i18n.t('kawaii:weather.conditions.snowy')).toBe('下雪');
    });
  });

  describe('Simplified Chinese translations', () => {
    beforeEach(() => {
      i18n.changeLanguage('zh-CN');
    });

    it('should translate common navigation items', () => {
      expect(i18n.t('kawaii:navigation.schedule')).toBe('行程');
      expect(i18n.t('kawaii:navigation.booking')).toBe('预约');
      expect(i18n.t('kawaii:navigation.shopping')).toBe('购物');
      expect(i18n.t('kawaii:navigation.checklist')).toBe('准备');
    });

    it('should translate theme colors', () => {
      expect(i18n.t('kawaii:theme.colors.pink')).toBe('粉红');
      expect(i18n.t('kawaii:theme.colors.orange')).toBe('橙色');
      expect(i18n.t('kawaii:theme.colors.blue')).toBe('蓝色');
    });
  });

  describe('Japanese translations', () => {
    beforeEach(() => {
      i18n.changeLanguage('ja');
    });

    it('should translate common navigation items', () => {
      expect(i18n.t('kawaii:navigation.schedule')).toBe('スケジュール');
      expect(i18n.t('kawaii:navigation.booking')).toBe('予約');
      expect(i18n.t('kawaii:navigation.shopping')).toBe('買い物');
      expect(i18n.t('kawaii:navigation.checklist')).toBe('チェックリスト');
      expect(i18n.t('kawaii:navigation.members')).toBe('メンバー');
      expect(i18n.t('kawaii:navigation.settings')).toBe('設定');
    });

    it('should translate countdown timer', () => {
      expect(i18n.t('kawaii:countdown.days', { count: 1 })).toBe('1 日');
      expect(i18n.t('kawaii:countdown.days', { count: 5 })).toBe('5 日');
      expect(i18n.t('kawaii:countdown.hours', { count: 1 })).toBe('1 時間');
      expect(i18n.t('kawaii:countdown.hours', { count: 3 })).toBe('3 時間');
    });

    it('should translate weather conditions', () => {
      expect(i18n.t('kawaii:weather.conditions.sunny')).toBe('晴れ');
      expect(i18n.t('kawaii:weather.conditions.rainy')).toBe('雨');
      expect(i18n.t('kawaii:weather.conditions.snowy')).toBe('雪');
    });

    it('should translate animation types', () => {
      expect(i18n.t('kawaii:theme.animationTypes.none')).toBe('なし');
      expect(i18n.t('kawaii:theme.animationTypes.snow')).toBe('雪');
      expect(i18n.t('kawaii:theme.animationTypes.sakura')).toBe('桜');
    });
  });

  describe('Sticker categories', () => {
    it('should translate sticker categories in all languages', () => {
      i18n.changeLanguage('en');
      expect(i18n.t('kawaii:stickers.categories.characters')).toBe('Characters');
      expect(i18n.t('kawaii:stickers.categories.food')).toBe('Food');
      expect(i18n.t('kawaii:stickers.categories.transportation')).toBe('Transportation');

      i18n.changeLanguage('zh-TW');
      expect(i18n.t('kawaii:stickers.categories.characters')).toBe('角色');
      expect(i18n.t('kawaii:stickers.categories.food')).toBe('美食');
      expect(i18n.t('kawaii:stickers.categories.transportation')).toBe('交通');

      i18n.changeLanguage('ja');
      expect(i18n.t('kawaii:stickers.categories.characters')).toBe('キャラクター');
      expect(i18n.t('kawaii:stickers.categories.food')).toBe('食べ物');
      expect(i18n.t('kawaii:stickers.categories.transportation')).toBe('交通');
    });
  });

  describe('Shopping tags', () => {
    it('should translate shopping tags in all languages', () => {
      i18n.changeLanguage('en');
      expect(i18n.t('kawaii:shopping.tags.food')).toBe('Food');
      expect(i18n.t('kawaii:shopping.tags.clothing')).toBe('Clothing');
      expect(i18n.t('kawaii:shopping.tags.important')).toBe('Important');

      i18n.changeLanguage('zh-TW');
      expect(i18n.t('kawaii:shopping.tags.food')).toBe('寄食');
      expect(i18n.t('kawaii:shopping.tags.clothing')).toBe('服飾');
      expect(i18n.t('kawaii:shopping.tags.important')).toBe('重要');

      i18n.changeLanguage('ja');
      expect(i18n.t('kawaii:shopping.tags.food')).toBe('食品');
      expect(i18n.t('kawaii:shopping.tags.clothing')).toBe('衣類');
      expect(i18n.t('kawaii:shopping.tags.important')).toBe('重要');
    });
  });

  describe('Language settings', () => {
    it('should have Japanese language option in settings', () => {
      i18n.changeLanguage('en');
      expect(i18n.t('settings:languages.ja')).toBe('日本語');

      i18n.changeLanguage('zh-TW');
      expect(i18n.t('settings:languages.ja')).toBe('日本語');

      i18n.changeLanguage('ja');
      expect(i18n.t('settings:languages.ja')).toBe('日本語');
    });
  });
});
