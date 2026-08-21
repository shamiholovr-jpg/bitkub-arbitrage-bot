import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Dashboard: undefined;
  History: undefined;
  Stats: undefined;
  Advisor: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  AddEntry: { initialCategoryId?: string } | undefined;
};
