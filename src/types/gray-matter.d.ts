declare module 'gray-matter' {
  function matter(str: string, options?: any): any;
  namespace matter {
    function stringify(content: string, data: any, options?: any): string;
    function read(filepath: string, options?: any): any;
  }
  export = matter;
}
