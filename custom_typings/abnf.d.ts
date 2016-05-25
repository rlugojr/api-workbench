declare module abnf {
  function Parse(input:string, calback?:Function):any;
}

declare module 'abnf' {
  export = abnf;
}