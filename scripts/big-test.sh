#!/bin/bash

# ┌────────────────────────────────────────────────────────────────────────────────┐
# │                                                                                │
# │   simple-test.sh                                                          │
# │                                                                                │
# ┼────────────────────────────────────────────────────────────────────────────────┼
# │   Guillaume Plante  <guillaumeplante.qc@gmail.com>                             │
# └────────────────────────────────────────────────────────────────────────────────┘

LogCategory=GenerateFilters
# node src/cli.js or hostlist-compiler

ExpectedVersion="1.0.29"

# Source the logging functions

if [ ! -d "$LOGGING" ]; then
    source /srv/scripts/logging.sh
else
    source $LOGGING
fi

log_il "\nsimple-test.sh - generate filters\nRunning client $COMPILER_CLIENT"

# Navigate to the parent directory (root directory where docker-compose.yml is located)
pushd "$(dirname "$0")/.." > /dev/null
RootPath=`pwd`
popd > /dev/null

COMPILER_CLIENT=$RootPath/src/cli.js
NODEBIN=$(which node)

# ...

CurrentVersion=$($COMPILER_CLIENT --version)
if [ "$CurrentVersion" == "$ExpectedVersion" ]; then
    log_ok "current version: $CurrentVersion.. OK"

else
    log_error "Error, expected version: $ExpectedVersion and Current Version $CurrentVersion"
    exit 1
fi

pushd $RootPath > /dev/null

NewMaxSize=2048


ConfigFile="$RootPath/test/test-config-big.json"
FilterOutputPath="$RootPath/test/out"
FilterOutput="$FilterOutputPath/test-config-big.txt"
log_info "   Compiling using log file --> $ConfigFile"
log_info "   Compiling output to      --> $FilterOutput"

mkdir -p "$FilterOutputPath"

# Record the start time

start_time=$(date +%s)

CurrentMaxSize=$(jq '.maxsize | tonumber' $ConfigFile)
NewMaxSize=17825792
log_info "Setting new max size to $NewMaxSize, was $CurrentMaxSize"
sed -i "s/\"maxsize\": *\"[0-9]\+\"/\"maxsize\": \"$NewMaxSize\"/" "$ConfigFile"

NewMaxSizeValueDetected=$(jq '.maxsize | tonumber' $ConfigFile)
log_info "New Max Size Value Detected $NewMaxSizeValueDetected"

# Execute the command
$NODEBIN $COMPILER_CLIENT -c "$ConfigFile" -o "$FilterOutput"
    
if [ $? -eq 0 ]; then
    log_ok "generated successfully: $FilterOutput"
else
    log_error "An error occurred while creating the filter."
    exit 1
fi

# Record the end time
end_time=$(date +%s)
    
# Calculate and print the elapsed time
elapsed_time=$((end_time - start_time))
log_info "Iteration $i completed in $elapsed_time seconds"

popd > /dev/null

log_ok "completed successfully!"
