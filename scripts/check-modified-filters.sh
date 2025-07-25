#!/bin/bash

# ┌────────────────────────────────────────────────────────────────────────────────┐
# │                                                                                │
# │   generate-filters.sh                                                          │
# │                                                                                │
# ┼────────────────────────────────────────────────────────────────────────────────┼
# │   Guillaume Plante  <guillaumeplante.qc@gmail.com>                             │
# └────────────────────────────────────────────────────────────────────────────────┘

LogCategory=CheckFilters
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[3;33m'
RESET='\033[0m'
SCRIPT="update-filters.sh"
TARGET_DIR="/home/www/default/filters"

echo -e "\n${YELLOW}check-filters.sh - generate filters${RESET}\n"

# Navigate to the root directory (where docker-compose.yml is located)
pushd "$(dirname "$0")/.." > /dev/null
RootPath="$(pwd)"
popd > /dev/null

pushd "$RootPath" > /dev/null

echo -e "${YELLOW}checking filters...${RESET}"

get_modified_line_count() {
    local file="$1"

    if [[ ! -f "$file" ]]; then
        echo 0
        return
    fi

    if ! git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
        echo 0
        return
    fi

    git diff --unified=0 -- "$file" | grep -E '^@@' | \
        sed -E 's/^@@ -[0-9,]+ \+([0-9]+)(,([0-9]+))? @@.*/\3/' | \
        awk '{s+=$1?s+$1:1} END{print s}'
}

get_all_modified_files() {
    {
        git diff --name-only --diff-filter=M
        git diff --cached --name-only --diff-filter=M
    } | sort -u
}

check_all_modified_files() {
    local file count
    local changed=0

    # Clear or create update script
    echo "#!/bin/bash" > "$SCRIPT"
    chmod +x "$SCRIPT"

    for file in $(get_all_modified_files); do
        count=$(get_modified_line_count "$file")
        filename=$(basename "$file")

        if [[ "$count" -gt 1 ]]; then
            echo -e "${RED}File '$file' has $count modified lines.${RESET}"
            echo "cp \"$file\" \"$TARGET_DIR/$filename\"" >> "$SCRIPT"
            ((changed++))
        else
            echo -e "${GREEN}File '$file' has $count or fewer modified lines.${RESET}"
        fi
    done

    if [[ "$changed" -eq 0 ]]; then
        rm -f "$SCRIPT"
        echo -e "${YELLOW}No significant changes detected. '$SCRIPT' not needed and was removed.${RESET}"
    else
        echo -e "${YELLOW}$changed file(s) with significant changes. '$SCRIPT' created.${RESET}"
        chmod +x "$SCRIPT"
        echo -e "${YELLOW}run './$SCRIPT' to update filters ${RESET}"
    fi
}

check_all_modified_files

popd > /dev/null

echo -e "${GREEN}completed successfully!${RESET}"
