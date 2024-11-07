# AdGuard SDN filter example

Check [configuration.json](configuration.json) for more details.


### Compile Method 1


```
npm i -g @adguard/hostlist-compiler

hostlist-compiler -c configuration.json -o filter.txt
```

### Compile Method 2

```
node src/cli.js -c filter-lists/configuration.json -o filter.txt

hostlist-compiler -c configuration.json -o filter.txt
```