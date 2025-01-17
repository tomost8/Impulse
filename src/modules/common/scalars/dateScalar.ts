import { GraphQLScalarType, Kind } from 'graphql';

/**
 * Custom GraphQL scalar type for handling dates in YYYY-MM-DD format
 */
export const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type for YYYY-MM-DD format',

  parseValue(inputValue: unknown): Date | null {
    if (typeof inputValue !== 'string') {
      throw new Error('Date must be a string in YYYY-MM-DD format');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(inputValue)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }
    // 直接返回字符串，避免使用 Date 对象
    return new Date(inputValue + 'T00:00:00');
  },
  
  serialize(outputValue: unknown): string {
    if (outputValue === null || outputValue === undefined) {
      return '';
    }
  
    if (!(outputValue instanceof Date)) {
      throw new Error('Value must be an instance of Date');
    }
  
    if (isNaN(outputValue.getTime())) {
      throw new Error('Invalid Date object');
    }
  
    return outputValue.toISOString().split('T')[0]; // 格式化为 yyyy-mm-dd
  },
  // 从 AST 解析日期
  parseLiteral(ast): Date | null {
    if (ast.kind === Kind.STRING) {
      // 验证日期格式
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ast.value)) {
        throw new Error('Date must be in YYYY-MM-DD format');
      }
      return new Date(ast.value);
    }
    return null;
  },
}); 