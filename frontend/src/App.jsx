import { useEffect } from 'react';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import useUserStore from './store/userStore';
import Router from './router';
import './index.css';

// OKLCH 色彩系统
const colorTokens = {
  // 背景色
  colorBgBase: '#0d0d12', // oklch(12% 0.01 260) 极深蓝黑
  colorBgContainer: '#15151d', // oklch(18% 0.02 260) 卡片层
  colorBgElevated: '#1c1c26', // oklch(22% 0.02 260) 悬浮层
  colorBgLayout: '#0a0a0f', // 最深背景
  
  // 品牌色
  colorPrimary: '#00e5ff', // oklch(70% 0.18 200) 电光青
  colorInfo: '#00e5ff',
  colorSuccess: '#00ff88', // 霓虹绿
  colorWarning: '#ff8c00', // 霓虹橙
  colorError: '#ff3366', // 霓虹红
  
  // 文字色
  colorTextBase: '#ffffff',
  colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
  colorTextTertiary: 'rgba(255, 255, 255, 0.45)',
  
  // 边框色
  colorBorder: '#2a2a38',
  colorBorderSecondary: '#1e1e28',
  
  // 圆角
  borderRadius: 8,
};

function App() {
  // 初始化用户状态
  useEffect(() => {
    useUserStore.getState().initialize();
  }, []);
  
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: colorTokens,
        components: {
          Card: {
            colorBgContainer: colorTokens.colorBgContainer,
            boxShadowTertiary: '0 4px 24px rgba(0, 229, 255, 0.06)',
          },
          Menu: {
            colorBgContainer: 'transparent',
            colorItemBg: 'transparent',
            colorItemBgHover: 'rgba(0, 229, 255, 0.08)',
            colorItemBgSelected: 'rgba(0, 229, 255, 0.12)',
            colorItemText: 'rgba(255, 255, 255, 0.85)',
            colorItemTextHover: '#00e5ff',
            colorItemTextSelected: '#00e5ff',
          },
          Button: {
            colorPrimary: colorTokens.colorPrimary,
            primaryShadow: '0 4px 12px rgba(0, 229, 255, 0.3)',
          },
          Input: {
            colorBgContainer: colorTokens.colorBgElevated,
            colorBorder: colorTokens.colorBorder,
            hoverBorderColor: '#00e5ff',
            activeBorderColor: '#00e5ff',
          },
          Tabs: {
            colorPrimary: colorTokens.colorPrimary,
            itemSelectedColor: colorTokens.colorPrimary,
            itemHoverColor: colorTokens.colorPrimary,
            inkBarColor: colorTokens.colorPrimary,
          },
          Layout: {
            colorBgBody: colorTokens.colorBgLayout,
            colorBgHeader: colorTokens.colorBgContainer,
            colorBgTrigger: colorTokens.colorBgElevated,
          },
          Avatar: {
            colorBgContainer: colorTokens.colorBgElevated,
          },
        },
      }}
    >
      <AntApp>
        <Router />
      </AntApp>
    </ConfigProvider>
  );
}

export default App;