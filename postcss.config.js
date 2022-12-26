module.exports = ctx => ({
  map: !ctx.env || ctx.env !== 'production' ? { inline: false } : false,
  plugins: [
    require('postcss-custom-properties')({
      preserve: false,
      // Breaks style lint and unnecessary if preserve set to false.
      // exportTo: 'dist-css/variables.css',
      importFrom: [
        'css/base/variables.css'
      ]
    }),
    require("postcss-calc"),
    require('autoprefixer')({
      cascade: false
    }),
  ]
});
