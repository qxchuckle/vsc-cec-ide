declare type ref<T> = {
    value: T
} // 因为 js 中的 number/string/boolean 这些基本量是传值的，而 object/array 这些对象是传指针的，当我们想在函数内部通过参数修改传进来的数据时，就得使用指针，所以我们把基本量包装成一个对象传进去，就可以实现在函数内部修改参数了