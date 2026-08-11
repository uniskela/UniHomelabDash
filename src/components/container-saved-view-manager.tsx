"use client";

import { useState } from "react";
import { BookmarkPlus, Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  BUILTIN_VIEW_IDS,
  builtinViewDefinition,
  createSavedViewId,
  isBuiltinViewId,
  isDuplicateViewName,
  maxUserViews,
  maxViewNameLength,
  normalizeViewName,
  type ContainerSavedView,
  type ContainerWorkspacePreferences,
} from "@/lib/providers/container-preferences";
import { cn } from "@/lib/utils";

const builtinChips = [
  BUILTIN_VIEW_IDS.all,
  BUILTIN_VIEW_IDS.running,
  BUILTIN_VIEW_IDS.stopped,
] as const;

export function ContainerSavedViewManager({
  workspace,
  draft,
  modified,
  onSelectView,
  onSaveWorkspace,
}: {
  workspace: ContainerWorkspacePreferences;
  draft: ContainerSavedView;
  modified: boolean;
  onSelectView: (viewId: string) => void;
  onSaveWorkspace: (workspace: ContainerWorkspacePreferences) => void;
}) {
  const [dialog, setDialog] = useState<"save-as" | "rename" | "delete" | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const activeIsBuiltin = isBuiltinViewId(workspace.activeViewId);
  const activeUserView = workspace.views.find((view) => view.id === workspace.activeViewId);
  const atViewLimit = workspace.views.length >= maxUserViews;

  function openSaveAs() {
    setNameDraft("");
    setFormError(null);
    setDialog("save-as");
  }

  function openRename() {
    if (!activeUserView) {
      return;
    }
    setNameDraft(activeUserView.name);
    setFormError(null);
    setDialog("rename");
  }

  function openDelete() {
    if (!activeUserView) {
      return;
    }
    setFormError(null);
    setDialog("delete");
  }

  function saveChanges() {
    if (activeIsBuiltin || !activeUserView) {
      return;
    }
    onSaveWorkspace({
      ...workspace,
      views: workspace.views.map((view) =>
        view.id === activeUserView.id
          ? {
              ...draft,
              id: activeUserView.id,
              name: activeUserView.name,
            }
          : view
      ),
    });
  }

  function confirmSaveAs() {
    const name = normalizeViewName(nameDraft);
    if (!name) {
      setFormError("Name is required (1–40 characters).");
      return;
    }
    if (isDuplicateViewName(workspace.views, name)) {
      setFormError("A view with that name already exists.");
      return;
    }
    if (atViewLimit) {
      setFormError(`You can save up to ${maxUserViews} views.`);
      return;
    }

    const nextView: ContainerSavedView = {
      ...draft,
      id: createSavedViewId(),
      name,
    };
    onSaveWorkspace({
      ...workspace,
      activeViewId: nextView.id,
      views: [...workspace.views, nextView],
    });
    setDialog(null);
  }

  function confirmRename() {
    if (!activeUserView) {
      return;
    }
    const name = normalizeViewName(nameDraft);
    if (!name) {
      setFormError("Name is required (1–40 characters).");
      return;
    }
    if (isDuplicateViewName(workspace.views, name, activeUserView.id)) {
      setFormError("A view with that name already exists.");
      return;
    }
    onSaveWorkspace({
      ...workspace,
      views: workspace.views.map((view) =>
        view.id === activeUserView.id ? { ...view, name } : view
      ),
    });
    setDialog(null);
  }

  function confirmDelete() {
    if (!activeUserView) {
      return;
    }
    onSaveWorkspace({
      ...workspace,
      activeViewId: BUILTIN_VIEW_IDS.all,
      views: workspace.views.filter((view) => view.id !== activeUserView.id),
    });
    setDialog(null);
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {builtinChips.map((id) => {
            const builtin = builtinViewDefinition(id);
            const selected = workspace.activeViewId === id;
            return (
              <Button
                key={id}
                type="button"
                size="sm"
                variant={selected ? "secondary" : "outline"}
                onClick={() => onSelectView(id)}
              >
                {builtin.name}
              </Button>
            );
          })}
          {workspace.views.map((view) => {
            const selected = workspace.activeViewId === view.id;
            return (
              <Button
                key={view.id}
                type="button"
                size="sm"
                variant={selected ? "secondary" : "outline"}
                onClick={() => onSelectView(view.id)}
                className={cn(selected && modified && "ring-1 ring-amber-400/40")}
              >
                {view.name}
                {selected && modified ? (
                  <span className="ml-1 text-[0.65rem] text-amber-300">•</span>
                ) : null}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!activeIsBuiltin && modified ? (
            <Button type="button" size="xs" variant="secondary" onClick={saveChanges}>
              <Check />
              Save changes
            </Button>
          ) : null}
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={openSaveAs}
            disabled={atViewLimit}
            title={atViewLimit ? `Maximum of ${maxUserViews} saved views` : undefined}
          >
            <BookmarkPlus />
            Save as
          </Button>
          {!activeIsBuiltin ? (
            <>
              <Button type="button" size="xs" variant="outline" onClick={openRename}>
                <Pencil />
                Rename
              </Button>
              <Button type="button" size="xs" variant="ghost" onClick={openDelete}>
                <Trash2 />
                Delete
              </Button>
            </>
          ) : null}
          {modified ? (
            <span className="text-xs text-amber-300" role="status">
              Unsaved changes
            </span>
          ) : null}
          {atViewLimit ? (
            <span className="text-xs text-muted-foreground">
              {maxUserViews}/{maxUserViews} views used
            </span>
          ) : null}
        </div>
      </div>

      <Dialog open={dialog === "save-as"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save view as</DialogTitle>
            <DialogDescription>
              Create a named view from the current filters and presentation.
            </DialogDescription>
          </DialogHeader>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Name</span>
            <Input
              value={nameDraft}
              maxLength={maxViewNameLength}
              onChange={(event) => setNameDraft(event.target.value)}
              placeholder="e.g. Immich hosts"
              autoFocus
            />
          </label>
          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmSaveAs}>
              Save view
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "rename"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename view</DialogTitle>
            <DialogDescription>Choose a unique name (1–40 characters).</DialogDescription>
          </DialogHeader>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Name</span>
            <Input
              value={nameDraft}
              maxLength={maxViewNameLength}
              onChange={(event) => setNameDraft(event.target.value)}
              autoFocus
            />
          </label>
          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmRename}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "delete"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete view</DialogTitle>
            <DialogDescription>
              Delete &quot;{activeUserView?.name}&quot;? Built-in views are unaffected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete view
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
