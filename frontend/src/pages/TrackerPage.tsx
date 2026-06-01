import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";
import TagDropdown from "../components/TagDropdown";
import TimerButton from "../components/TimerButton";
import ElapsedDisplay from "../components/ElapsedDisplay";
import NewTagModal from "../components/NewTagModal";
import DescriptionForm from "../components/DescriptionForm";
import { useTags } from "../hooks/useTags";
import { useElapsed } from "../hooks/useElapsed";
import { api } from "../api/client";
import type { TrackingSession } from "../types";

export default function TrackerPage() {
  const { tags, createTag } = useTags();
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [active, setActive] = useState<TrackingSession | null>(null);
  const [justStopped, setJustStopped] = useState<TrackingSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);

  useEffect(() => {
    api
      .get<TrackingSession | null>("/sessions/active")
      .then((s) => {
        if (s) {
          setActive(s);
          setSelectedTagId(s.tagId);
        }
      })
      .catch((err) => console.error("load active session failed:", err));
  }, []);

  const elapsed = useElapsed(
    active?.startedAt ?? justStopped?.startedAt ?? null,
    justStopped?.endedAt ?? null
  );

  const onToggle = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (active) {
        const stopped = await api.post<TrackingSession>(`/sessions/${active.id}/stop`);
        setActive(null);
        setJustStopped(stopped);
      } else {
        if (!selectedTagId) return;
        const started = await api.post<TrackingSession>("/sessions/start", {
          tagId: selectedTagId,
        });
        setActive(started);
        setJustStopped(null);
      }
    } catch (err) {
      console.error("toggle failed:", err);
    } finally {
      setBusy(false);
    }
  }, [active, busy, selectedTagId]);

  const onSaveDescription = useCallback(
    async (description: string) => {
      if (!justStopped) return;
      await api.patch(`/sessions/${justStopped.id}`, { description });
      setJustStopped(null);
    },
    [justStopped]
  );

  const onDiscardDescription = useCallback(() => {
    setJustStopped(null);
  }, []);

  const canStart = !active && !!selectedTagId && !busy;
  const buttonDisabled = active ? busy : !canStart;

  return (
    <div className="flex h-full">
      <Sidebar tags={tags} onNewTag={() => setShowNewTag(true)} />

      <main className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <TagDropdown
            tags={tags}
            value={selectedTagId}
            onChange={setSelectedTagId}
            disabled={!!active}
          />
          <TimerButton running={!!active} disabled={buttonDisabled} onClick={onToggle} />
          <ElapsedDisplay elapsed={elapsed} frozen={!!justStopped} />

          <AnimatePresence>
            {justStopped && (
              <DescriptionForm
                key={justStopped.id}
                onSave={onSaveDescription}
                onDiscard={onDiscardDescription}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {showNewTag && (
          <NewTagModal
            onCreate={async (name, color) => {
              await createTag(name, color);
              setShowNewTag(false);
            }}
            onClose={() => setShowNewTag(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
