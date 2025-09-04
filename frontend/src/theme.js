import { extendTheme } from "@chakra-ui/react";

const config = {
  initialColorMode: "dark",
  useSystemColorMode: true,
};

// Paleta de colores ultra moderna
const colors = {
  brand: {
    50: "#E6F7FF",
    100: "#BAE7FF", 
    200: "#91D5FF",
    300: "#69C0FF",
    400: "#40A9FF",
    500: "#1890FF", // Color principal
    600: "#096DD9",
    700: "#0050B3",
    800: "#003A8C",
    900: "#002766",
  },
  accent: {
    50: "#FFF0F6",
    100: "#FFD6E7",
    200: "#FFADD2", 
    300: "#FF85C0",
    400: "#F759AB",
    500: "#EB2F96", // Accent principal
    600: "#C41D7F",
    700: "#9E1068",
    800: "#780650",
    900: "#52003B",
  },
  success: {
    50: "#F6FFED",
    500: "#52C41A",
  },
  warning: {
    50: "#FFFBE6",
    500: "#FAAD14",
  },
  error: {
    50: "#FFF2F0",
    500: "#FF4D4F",
  },
  gray: {
    50: "#FAFAFA",
    100: "#F5F5F5", 
    200: "#E8E8E8",
    300: "#D9D9D9",
    400: "#BFBFBF",
    500: "#8C8C8C",
    600: "#595959",
    700: "#434343",
    800: "#262626",
    900: "#141414",
  }
};

// Componentes personalizados con diseño ultra moderno
const components = {
  Button: {
    baseStyle: {
      fontWeight: "600",
      borderRadius: "12px",
      transition: "all 0.2s ease-in-out",
      _hover: {
        transform: "translateY(-2px)",
        shadow: "xl",
      },
      _active: {
        transform: "translateY(0px)",
      }
    },
    variants: {
      solid: {
        bg: "linear-gradient(135deg, brand.500, brand.600)",
        color: "white",
        _hover: {
          bg: "linear-gradient(135deg, brand.600, brand.700)",
          _disabled: {
            bg: "linear-gradient(135deg, brand.500, brand.600)",
          }
        }
      },
      ghost: {
        color: "brand.500",
        _hover: {
          bg: "brand.50",
          _dark: {
            bg: "brand.900"
          }
        }
      },
      outline: {
        borderColor: "brand.500",
        color: "brand.500",
        _hover: {
          bg: "brand.50",
          borderColor: "brand.600",
          _dark: {
            bg: "brand.900"
          }
        }
      }
    },
    sizes: {
      lg: {
        h: "12",
        px: "8",
        fontSize: "lg"
      }
    }
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: "20px",
        bg: "white",
        border: "1px solid",
        borderColor: "gray.100",
        shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        transition: "all 0.3s ease-in-out",
        _hover: {
          transform: "translateY(-4px)",
          shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        },
        _dark: {
          bg: "gray.800",
          borderColor: "gray.700",
        }
      }
    }
  },
  Input: {
    variants: {
      outline: {
        field: {
          borderRadius: "12px",
          borderColor: "gray.200",
          bg: "white",
          _hover: {
            borderColor: "brand.300",
          },
          _focus: {
            borderColor: "brand.500",
            shadow: "0 0 0 3px rgba(24, 144, 255, 0.1)",
          },
          _dark: {
            bg: "gray.700",
            borderColor: "gray.600",
          }
        }
      }
    }
  },
  Select: {
    variants: {
      outline: {
        field: {
          borderRadius: "12px",
          borderColor: "gray.200", 
          bg: "white",
          _hover: {
            borderColor: "brand.300",
          },
          _focus: {
            borderColor: "brand.500",
            shadow: "0 0 0 3px rgba(24, 144, 255, 0.1)",
          },
          _dark: {
            bg: "gray.700",
            borderColor: "gray.600",
          }
        }
      }
    }
  },
  Badge: {
    variants: {
      solid: {
        borderRadius: "full",
        px: 3,
        py: 1,
        fontSize: "xs",
        textTransform: "uppercase",
        letterSpacing: "wider",
        fontWeight: "bold"
      }
    }
  }
};

const theme = extendTheme({
  config,
  colors,
  components,
  fonts: {
    heading: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    body: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  fontSizes: {
    xs: "0.75rem",
    sm: "0.875rem", 
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
    "6xl": "3.75rem",
  },
  styles: {
    global: (props) => ({
      "html, body, #root": { 
        height: "100%",
        scrollBehavior: "smooth"
      },
      body: { 
        bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
        transition: "background-color 0.2s ease-in-out",
      },
      // Scrollbar personalizada
      "*::-webkit-scrollbar": {
        width: "8px",
      },
      "*::-webkit-scrollbar-track": {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'gray.100',
        borderRadius: "full",
      },
      "*::-webkit-scrollbar-thumb": {
        bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
        borderRadius: "full",
        _hover: {
          bg: props.colorMode === 'dark' ? 'gray.500' : 'gray.400',
        }
      },
    }),
  },
  radii: { 
    none: "0",
    sm: "0.375rem",
    base: "0.5rem", 
    md: "0.75rem",
    lg: "1rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "2rem",
    full: "9999px"
  },
  shadows: {
    xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
    glow: "0 0 20px rgba(24, 144, 255, 0.3)",
    "glow-accent": "0 0 20px rgba(235, 47, 150, 0.3)",
  },
  // Estilos para glassmorphism
  blur: {
    none: "0",
    sm: "4px",
    base: "8px", 
    md: "12px",
    lg: "16px",
    xl: "24px",
    "2xl": "40px",
    "3xl": "64px",
  }
});

export default theme;
