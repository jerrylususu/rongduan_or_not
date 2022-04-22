# 今天航班熔断了吗？

根据已知的阳性病例数推断航班熔断情况。

* 小熔断：5~9 例，第四周起熔断 2 班
* 大熔断：10~29 例，第四周起熔断 4 班
* 超级熔断：30 例+，当周起立刻熔断 4 班

* 航班入境为第一周
* 阳性病例计数范围：入境当日 - 入境后第七天
* 若熔断时间重叠，则向后顺延
* 若连续两周 10 例或以上阳性，立刻熔断八周

[link](https://nekonull.me/rongduan/)

icon credit: https://thenounproject.com/icon/flight-1388095/


## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
