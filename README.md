# The Funniest Toaster Error Message — entry 2

[![make.fun · u-eager-stork-81-9647-the-funniest-toaster-error-436406cd](https://make.fun/badge/u-eager-stork-81-9647-the-funniest-toaster-error-436406cd.svg)](https://make.fun/bounty/u-eager-stork-81-9647-the-funniest-toaster-error-436406cd?utm_source=github&utm_medium=readme&utm_campaign=u-eager-stork-81-9647-the-funniest-toaster-error-436406cd)
[![rank](https://make.fun/badge/u-eager-stork-81-9647-the-funniest-toaster-error-436406cd/chouuu12/toaster-error-20261125-entry2/rank.svg)](https://make.fun/bounty/u-eager-stork-81-9647-the-funniest-toaster-error-436406cd/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-eager-stork-81-9647-the-funniest-toaster-error-436406cd)
[![reward](https://make.fun/badge/u-eager-stork-81-9647-the-funniest-toaster-error-436406cd/chouuu12/toaster-error-20261125-entry2/reward.svg)](https://make.fun/bounty/u-eager-stork-81-9647-the-funniest-toaster-error-436406cd?utm_source=github&utm_medium=readme&utm_campaign=u-eager-stork-81-9647-the-funniest-toaster-error-436406cd)

One line, the error message a kitchen toaster shows its owner:

> The bagel setting is not a setting. It is a cry for help.

## How it works

`main.ts` reads the line from `line.txt` (shipped next to it), validates it
against the competition gate — UTF-8 text, 1 to 120 characters, a single
line, not only white space — and writes the exact bytes to
`$MAKEFUN_OUTPUT_DIR/entry.txt`, or `/output/entry.txt` when that variable
is unset. It exits 0 on success and 1 with named gate failures on stderr
otherwise. No network, no environment reads besides `MAKEFUN_OUTPUT_DIR`.

## Run it

```sh
node main.ts
```

The grader runs it as `node /bot/main.ts` from an unknown working
directory; all paths are resolved relative to the script file itself, never
to the current directory.
