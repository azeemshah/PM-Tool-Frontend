#!/bin/bash

echo "🧪 Scrumboard Migration Verification"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1 exists"
    return 0
  else
    echo -e "${RED}✗${NC} $1 missing"
    return 1
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✓${NC} Directory $1 exists"
    return 0
  else
    echo -e "${RED}✗${NC} Directory $1 missing"
    return 1
  fi
}

check_not_exist() {
  if [ ! -d "$1" ] && [ ! -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1 successfully removed"
    return 0
  else
    echo -e "${RED}✗${NC} $1 still exists"
    return 1
  fi
}

echo "📋 Checking Scrumboard API Layer..."
check_dir "src/api/scrumboard"
check_file "src/api/scrumboard/types/index.ts"
check_file "src/api/scrumboard/services/scrumboardApiService.ts"

echo ""
echo "📦 Checking Scrumboard Hooks..."
check_file "src/api/scrumboard/hooks/boards/useGetScrumboardBoards.ts"
check_file "src/api/scrumboard/hooks/boards/useGetScrumboardBoard.ts"
check_file "src/api/scrumboard/hooks/cards/useGetScrumboardBoardCards.ts"
check_file "src/api/scrumboard/hooks/lists/useGetScrumboardBoardLists.ts"
check_file "src/api/scrumboard/hooks/order/useScrumboardReorder.ts"

echo ""
echo "🎨 Checking Scrumboard Components..."
check_dir "src/components/scrumboard"
check_file "src/components/scrumboard/ScrumboardBoardView.tsx"
check_file "src/components/scrumboard/ScrumboardLayout.tsx"
check_file "src/components/scrumboard/BoardHeader.tsx"
check_file "src/components/scrumboard/BoardList.tsx"
check_file "src/components/scrumboard/BoardCard.tsx"
check_file "src/components/scrumboard/dialogs/BoardCardDialog.tsx"

echo ""
echo "🌍 Checking Scrumboard Context..."
check_dir "src/contexts/ScrumboardAppContext"
check_file "src/contexts/ScrumboardAppContext/ScrumboardAppContext.ts"
check_file "src/contexts/ScrumboardAppContext/ScrumboardAppContextProvider.tsx"
check_file "src/contexts/ScrumboardAppContext/useScrumboardAppContext.ts"

echo ""
echo "🔌 Checking Scrumboard Routes..."
check_file "src/routes/scrumboardRoutes.ts"
check_file "src/routes/index.tsx"

echo ""
echo "❌ Verifying Kanban Removal..."
check_not_exist "src/components/kanban"

echo ""
echo "✅ Verification Complete!"
echo ""
