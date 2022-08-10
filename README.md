# 今天航班熔断了吗？

根据已知的阳性病例数推断航班熔断情况。

* 正常：航班状态正常（阳性数小于5，或阳性数不超过本航班入境人数的4%，不触发熔断）
* 小熔断：阳性数大于等于5，且超过入境人数的4%，且不超过入境人数的8%，触发航班入境第四周起的 1 周熔断
* 大熔断：阳性数大于等于5，且超过入境人数的8%，触发航班入境第四周起的 2 周熔断

* 航班入境为第一周
* 阳性病例计数范围：入境当日 - 入境第 5 天
* 若熔断时间重叠，则向后顺延

[link](https://nekonull.me/rongduan/)

icon credit: https://thenounproject.com/icon/flight-1388095/

项目根目录下的 `sim2.py` 为「航班安全性计算」（实验性）的 Python 源代码。如有需要可以使用此文件进行自己的数据分析。


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
