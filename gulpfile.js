var gulp = require('gulp');
var htmlmin = require('gulp-htmlmin');


// 压缩html文件
gulp.task('minify-html', function (done) {
    return gulp.src('./public/**/*.html')
		.pipe(htmlmin({
            removeComments: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true,
        }))
        .pipe(gulp.dest('./public'));
    done();
});



// 执行 gulp 命令时执行的任务
gulp.task('default', gulp.series(gulp.parallel('minify-html')), function () {
    console.log("----------gulp Finished----------");
    // Do something after a, b, and c are finished.
});