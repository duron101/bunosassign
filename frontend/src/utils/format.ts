/**
 * 格式化工具函数
 */

/**
 * 格式化货币金额
 * @param value 金额数值
 * @param currency 货币符号，默认为 '¥'
 * @param decimals 小数位数，默认为 2
 * @returns 格式化后的货币字符串
 */
export const formatCurrency = (
  value: number | string | null | undefined,
  currency: string = '¥',
  decimals: number = 2
): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '-';
  }

  // 处理负数
  const isNegative = numValue < 0;
  const absValue = Math.abs(numValue);

  // 格式化数字
  const formattedNumber = absValue.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  // 添加货币符号和负号
  return `${isNegative ? '-' : ''}${currency}${formattedNumber}`;
};

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @param format 格式化模式，默认为 'YYYY-MM-DD'
 * @returns 格式化后的日期字符串
 */
export const formatDate = (
  date: string | Date | null | undefined,
  format: string = 'YYYY-MM-DD'
): string => {
  if (!date) {
    return '-';
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');

    switch (format) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'YYYY-MM-DD HH:mm':
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      case 'YYYY-MM-DD HH:mm:ss':
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      case 'MM-DD':
        return `${month}-${day}`;
      case 'HH:mm':
        return `${hours}:${minutes}`;
      default:
        return `${year}-${month}-${day}`;
    }
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '-';
  }
};

/**
 * 格式化日期时间（完整格式）
 * @param dateTime 日期时间字符串或Date对象
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (
  dateTime: string | Date | null | undefined
): string => {
  return formatDate(dateTime, 'YYYY-MM-DD HH:mm:ss');
};

/**
 * 格式化百分比
 * @param value 数值
 * @param decimals 小数位数，默认为 2
 * @returns 格式化后的百分比字符串
 */
export const formatPercentage = (
  value: number | string | null | undefined,
  decimals: number = 2
): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '-';
  }

  return `${(numValue * 100).toFixed(decimals)}%`;
};

/**
 * 格式化数字（添加千分位分隔符）
 * @param value 数值
 * @param decimals 小数位数，默认为 0
 * @returns 格式化后的数字字符串
 */
export const formatNumber = (
  value: number | string | null | undefined,
  decimals: number = 0
): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '-';
  }

  return numValue.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};
