// config/theme.ts
export const themeConfig = {
  colors: {
    primary: {
      dashboard: { light: 'indigo', dark: 'indigo' },
      stock: { light: 'blue', dark: 'blue' },
      livraison: { light: 'orange', dark: 'orange' },
      vendu: { light: 'green', dark: 'green' },
      historique: { light: 'purple', dark: 'purple' },
      parametres: { light: 'gray', dark: 'gray' }
    }
  },
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1280
  }
};

export const getColorClasses = (page: string, theme: 'light' | 'dark') => {
  const color = themeConfig.colors.primary[page as keyof typeof themeConfig.colors.primary]?.[theme] || 'indigo';
  
  return {
    primary: {
      bg: `bg-${color}-600`,
      text: `text-${color}-600`,
      border: `border-${color}-600`,
      hover: `hover:bg-${color}-700`
    },
    secondary: {
      bg: `bg-${color}-100 dark:bg-${color}-900/20`,
      text: `text-${color}-600 dark:text-${color}-400`,
      border: `border-${color}-200 dark:border-${color}-800`
    }
  };
};