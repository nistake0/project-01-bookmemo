import { Box } from '@mui/material';

/**
 * タブパネルコンポーネント（Material-UI拡張）
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - 子要素
 * @param {number} props.value - 現在のタブインデックス
 * @param {number} props.index - このパネルのインデックス
 * @param {Object} props.other - その他のprops
 */
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default TabPanel; 