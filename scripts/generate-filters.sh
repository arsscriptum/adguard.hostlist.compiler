#!/bin/bash

# ┌────────────────────────────────────────────────────────────────────────────────┐
# │                                                                                │
# │   generate-filters.sh                                                          │
# │                                                                                │
# ┼────────────────────────────────────────────────────────────────────────────────┼
# │   Guillaume Plante  <guillaumeplante.qc@gmail.com>                             │
# └────────────────────────────────────────────────────────────────────────────────┘

LogCategory=GenerateFilters
 
# Source the logging functions

if [ ! -d "$LOGGING" ]; then
    source /srv/scripts/logging.sh
else
    source $LOGGING
fi

log_il "\ngenerate-filters.sh - generate filters\n"

# Navigate to the parent directory (root directory where docker-compose.yml is located)
pushd "$(dirname "$0")/.." > /dev/null
RootPath=`pwd`
popd

# ...
log_warning "generate filters..."


pushd $RootPath > /dev/null

for i in $(seq -w 1 10); do
    ConfigFile="$RootPath/filter-configs/config-$i.json"
    FilterOutput="$RootPath/filter-list/filter-$i.txt"
    
    # Record the start time
    start_time=$(date +%s)
    
    # Execute the command
    node src/cli.js -c "$ConfigFile" -o "$FilterOutput"
    
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
done

popd





log_ok "completed successfully!"
