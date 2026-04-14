#!/bin/bash

echo "🧪 Kanban Migration Verification"
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

echo "📋 Checking Kanban API Layer..."
check_dir "src/api/kanban"
check_file "src/api/kanban/types/index.ts"
check_file "src/api/kanban/services/kanbanApiService.ts"

echo ""
echo "📦 Checking Kanban Hooks..."
check_file "src/api/kanban/hooks/boards/useGetKanbanBoards.ts"
check_file "src/api/kanban/hooks/boards/useGetKanbanBoard.ts"
check_file "src/api/kanban/hooks/cards/useGetKanbanBoardCards.ts"
check_file "src/api/kanban/hooks/lists/useGetKanbanBoardLists.ts"
check_file "src/api/kanban/hooks/order/useKanbanReorder.ts"

echo ""
echo "🎨 Checking Kanban Components..."
check_dir "src/components/kanban"
check_file "src/components/kanban/KanbanBoardView.tsx"
check_file "src/components/kanban/KanbanLayout.tsx"
check_file "src/components/kanban/BoardHeader.tsx"
check_file "src/components/kanban/BoardList.tsx"
check_file "src/components/kanban/BoardCard.tsx"
check_file "src/components/kanban/dialogs/BoardCardDialog.tsx"

echo ""
echo "🌍 Checking Kanban Context..."
check_dir "src/contexts/KanbanAppContext"
check_file "src/contexts/KanbanAppContext/KanbanAppContext.ts"
check_file "src/contexts/KanbanAppContext/KanbanAppContextProvider.tsx"
check_file "src/contexts/KanbanAppContext/useKanbanAppContext.ts"

echo ""
echo "🔌 Checking Kanban Routes..."
check_file "src/routes/kanbanRoutes.ts"
check_file "src/routes/index.tsx"

echo ""
echo "❌ Verifying Old Scrumboard Removal..."
check_not_exist "src/components/scrumboard"

echo ""
echo "✅ Verification Complete!"
echo ""

