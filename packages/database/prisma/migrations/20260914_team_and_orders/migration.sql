-- AlterTable User: add role and isActive
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'SALES_REP';

-- CreateTable WorkspaceInvite
CREATE TABLE IF NOT EXISTS "WorkspaceInvite" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'SALES_REP',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "WorkspaceInvite_pkey" PRIMARY KEY ("id")
);

-- Unique Token and Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceInvite_token_key" ON "WorkspaceInvite"("token");
CREATE INDEX IF NOT EXISTS "WorkspaceInvite_workspaceId_email_idx" ON "WorkspaceInvite"("workspaceId", "email");
CREATE INDEX IF NOT EXISTS "WorkspaceInvite_token_idx" ON "WorkspaceInvite"("token");

-- AddForeignKey WorkspaceInvite -> Workspace
ALTER TABLE "WorkspaceInvite" 
    DROP CONSTRAINT IF EXISTS "WorkspaceInvite_workspaceId_fkey";
ALTER TABLE "WorkspaceInvite" 
    ADD CONSTRAINT "WorkspaceInvite_workspaceId_fkey" 
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable Order: add assignedToId
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "assignedToId" TEXT;

-- AddForeignKey Order -> User (assignedTo)
ALTER TABLE "Order" 
    DROP CONSTRAINT IF EXISTS "Order_assignedToId_fkey";
ALTER TABLE "Order" 
    ADD CONSTRAINT "Order_assignedToId_fkey" 
    FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Order_assignedToId_idx" ON "Order"("assignedToId");
