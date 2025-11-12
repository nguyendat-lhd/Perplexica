#!/bin/bash
# Script: Update Perplexica từ Upstream
# Usage: ./scripts/update-upstream.sh [branch]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

UPSTREAM_REPO="https://github.com/ItzCrazyKns/Perplexica.git"
UPSTREAM_BRANCH="${1:-main}"
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

echo -e "${GREEN}🔄 Updating Perplexica from upstream...${NC}"
echo ""

# Add upstream remote if not exists
if ! git remote | grep -q upstream; then
    echo -e "${YELLOW}📡 Adding upstream remote...${NC}"
    git remote add upstream "$UPSTREAM_REPO"
else
    echo -e "${GREEN}✓ Upstream remote exists${NC}"
fi

# Fetch latest from upstream
echo -e "${YELLOW}📥 Fetching from upstream ($UPSTREAM_BRANCH)...${NC}"
git fetch upstream "$UPSTREAM_BRANCH"

# Show what's new
echo ""
echo -e "${YELLOW}📊 Changes from upstream:${NC}"
git log HEAD..upstream/$UPSTREAM_BRANCH --oneline | head -10 || echo "  No new changes"

# Ask for confirmation
echo ""
read -p "Continue with merge? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏸️  Update cancelled${NC}"
    exit 0
fi

# Stash current changes if any
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}💾 Stashing current changes...${NC}"
    git stash push -m "Auto-stash before upstream update"
    STASHED=true
fi

# Checkout current branch
echo -e "${YELLOW}📍 Checking out branch: $CURRENT_BRANCH${NC}"
git checkout "$CURRENT_BRANCH"

# Merge upstream
echo -e "${YELLOW}🔀 Merging upstream/$UPSTREAM_BRANCH...${NC}"
if git merge upstream/$UPSTREAM_BRANCH --no-edit; then
    echo -e "${GREEN}✅ Merge successful!${NC}"
    
    # Restore stashed changes if any
    if [ "$STASHED" = true ]; then
        echo -e "${YELLOW}📦 Restoring stashed changes...${NC}"
        git stash pop || echo "  No conflicts with stashed changes"
    fi
    
    echo ""
    echo -e "${GREEN}✅ Update completed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review changes: git log HEAD~1..HEAD"
    echo "  2. Test: npm run dev"
    echo "  3. Build: npm run build"
    echo "  4. Push: git push origin $CURRENT_BRANCH"
    echo ""
    echo -e "${YELLOW}⚠️  Note: If upstream changed src/mcp/, you may need to sync to apps/mcp-server/${NC}"
else
    echo -e "${RED}❌ Conflicts detected!${NC}"
    echo ""
    echo "Please resolve conflicts manually:"
    echo "  1. Check conflicts: git status"
    echo "  2. Resolve conflicts in files"
    echo "  3. Stage resolved files: git add ."
    echo "  4. Continue merge: git commit"
    echo ""
    
    # Restore stashed changes
    if [ "$STASHED" = true ]; then
        echo -e "${YELLOW}📦 Stashed changes preserved${NC}"
    fi
    
    exit 1
fi

