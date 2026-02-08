import 'react-i18next';

// Import English translations as type sources
import enCommon from '../locales/en/common.json';
import enTrip from '../locales/en/trip.json';
import enPlace from '../locales/en/place.json';
import enBudget from '../locales/en/budget.json';
import enPacking from '../locales/en/packing.json';
import enCommunity from '../locales/en/community.json';
import enSettings from '../locales/en/settings.json';
import enErrors from '../locales/en/errors.json';
import enKawaii from '../locales/en/kawaii.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof enCommon;
      trip: typeof enTrip;
      place: typeof enPlace;
      budget: typeof enBudget;
      packing: typeof enPacking;
      community: typeof enCommunity;
      settings: typeof enSettings;
      errors: typeof enErrors;
      kawaii: typeof enKawaii;
    };
  }
}
