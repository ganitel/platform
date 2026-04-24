import { useNavigate } from "react-router-dom";
import { Plus, MoreVertical, ChevronLeft, Calendar, Share2, Trash2, Edit2 } from "lucide-react";
import type { ServiceListItem } from "@shared/api";
import { useWishlistState } from "@/hooks";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { PropertySearchResultCard } from "@/components/PropertySearchResultCard";
import { PropertyCard } from "@/components/PropertyCard";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MyWishlist() {
  const navigate = useNavigate();
  const { entries, collections, removeProperty, removeCollection, createCollection, updateCollection } = useWishlistState();

  const [activeTab, setActiveTab] = useState<"favorites" | "collections">("favorites");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedFavoriteGroupKey, setSelectedFavoriteGroupKey] = useState<string | null>(null);

  // States for the creation/rename drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "rename">("create");
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [collectionNameInput, setCollectionNameInput] = useState("");
  const [collectionDescriptionInput, setCollectionDescriptionInput] = useState("");


  const handleRemoveProperty = (id: string, name: string) => {
    removeProperty(id);
    toast.success(`${name} removed from favorites`);
  };

  const handleDeleteCollection = (id: string, name: string) => {
    removeCollection(id);
    toast.success(`Collection "${name}" deleted`);
  };

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setCollectionNameInput("");
    setCollectionDescriptionInput("");
    setEditingCollectionId(null);
    setIsDrawerOpen(true);
  };

  const openRenameDrawer = (id: string, currentName: string, currentDescription: string) => {
    setDrawerMode("rename");
    setCollectionNameInput(currentName);
    setCollectionDescriptionInput(currentDescription);
    setEditingCollectionId(id);
    setIsDrawerOpen(true);
  };

  const handleDrawerAction = () => {
    if (!collectionNameInput.trim()) {
      toast.error("Please enter a name");
      return;
    }

    if (!collectionDescriptionInput.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (drawerMode === "create") {
      const imageUrl = `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=300&h=300`;
      createCollection(collectionNameInput, imageUrl, collectionDescriptionInput);
      toast.success(`Collection "${collectionNameInput}" created`);
    } else if (drawerMode === "rename" && editingCollectionId) {
      updateCollection(editingCollectionId, {
        name: collectionNameInput,
        description: collectionDescriptionInput,
      });
      toast.success(`Collection renamed to "${collectionNameInput}"`);
    }

    setCollectionNameInput("");
    setCollectionDescriptionInput("");
    setIsDrawerOpen(false);
  };


  // Get active collection details
  const activeCollection = useMemo(() => {
    return collections.find(c => c.id === selectedCollectionId);
  }, [collections, selectedCollectionId]);

  // Favorites and collection entries
  const favoriteEntries = useMemo(() => {
    return entries.filter((entry) => !entry.collectionId);
  }, [entries]);

  const favoriteGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        label: string;
        monthTag: string;
        cityLabel: string;
        count: number;
        images: string[];
        createdAt: number;
      }
    >();

    const monthNames = [
      "Janvier",
      "Fevrier",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Aout",
      "Septembre",
      "Octobre",
      "Novembre",
      "Decembre",
    ];

    favoriteEntries.forEach((entry) => {
      if (!entry.snapshot) return;
      const date = entry.addedAt ? new Date(entry.addedAt) : new Date();
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const cityLabel = entry.snapshot.location?.city || "Favorites";
      const cityKey = cityLabel.toLowerCase().replace(/\s+/g, "-");
      const groupKey = `${cityKey}-${monthKey}`;
      const monthName = monthNames[date.getMonth()];
      const year = date.getFullYear();
      const monthLabel = `${monthName} ${year}`;
      const monthTag = `${monthName} - ${year}`;
      const label = `${cityLabel} - ${monthLabel}`;

      const existing = groups.get(groupKey);
      if (existing) {
        existing.count += 1;
        if (entry.snapshot.main_image_url && existing.images.length < 3) {
          existing.images.push(entry.snapshot.main_image_url);
        }
        if (date.getTime() > existing.createdAt) {
          existing.createdAt = date.getTime();
          existing.monthTag = monthTag;
        }
      } else {
        groups.set(groupKey, {
          key: groupKey,
          label,
          monthTag,
          cityLabel,
          count: 1,
          images: entry.snapshot.main_image_url ? [entry.snapshot.main_image_url] : [],
          createdAt: date.getTime(),
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) => b.createdAt - a.createdAt);
  }, [favoriteEntries]);

  const favoriteGroupEntries = useMemo(() => {
    const map = new Map<string, typeof favoriteEntries>();

    favoriteEntries.forEach((entry) => {
      if (!entry.snapshot) return;
      const date = entry.addedAt ? new Date(entry.addedAt) : new Date();
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const cityLabel = entry.snapshot.location?.city || "Favorites";
      const cityKey = cityLabel.toLowerCase().replace(/\s+/g, "-");
      const groupKey = `${cityKey}-${monthKey}`;
      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }
      map.get(groupKey)?.push(entry);
    });

    return map;
  }, [favoriteEntries]);

  // Filter entries for the selected collection
  const filteredEntries = useMemo(() => {
    if (!selectedCollectionId) return [];
    return entries.filter(e => e.collectionId === selectedCollectionId);
  }, [entries, selectedCollectionId]);

  // View: Collection Details (Properties Grid)
  if (selectedCollectionId && activeCollection) {
    return (
      <div className="min-h-screen bg-white pb-32">
        <Header />
        <main className="px-4 pt-6 max-w-5xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => setSelectedCollectionId(null)}
              className="flex items-center gap-1 text-ganitel-text-label font-medium mb-4 hover:text-ganitel-text-title transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to wishlist
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-[32px] font-bold leading-tight text-ganitel-text-title flex items-center gap-2">
                  {activeCollection.name}
                  <img src="/icons/heart.svg" alt="Heart" className="w-6 h-6" />
                </h1>
                <p className="mt-1 text-base text-ganitel-text-label">
                  {filteredEntries.length} properties in this collection.
                </p>
              </div>

              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-ganitel-accent-grey rounded-2xl text-sm font-semibold text-ganitel-text-title shadow-sm">
                  <Calendar className="w-4 h-4" />
                  Availability
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-ganitel-accent-grey rounded-2xl text-sm font-semibold text-ganitel-text-title shadow-sm">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-4 bg-ganitel-neutral-1 rounded-3xl border-2 border-dashed border-ganitel-stroke-neutral">
              <p className="text-ganitel-text-label">This collection is empty.</p>
              <Button onClick={() => navigate("/")} variant="outline" className="rounded-xl">
                Explore properties to add
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {filteredEntries.map((entry) => {
                const p = entry.snapshot;
                if (!p) return null;
                return (
                  <PropertySearchResultCard
                    key={p.id}
                    property={p as unknown as ServiceListItem}
                    nights={7}
                    onToggleWishlist={() => handleRemoveProperty(p.id, p.title)}
                  />
                );
              })}
            </div>
          )}
        </main>
        <BottomNav />
      </div>
    );
  }

  // View: Favorites Group Detail
  if (activeTab === "favorites" && selectedFavoriteGroupKey) {
    const activeGroup = favoriteGroups.find((group) => group.key === selectedFavoriteGroupKey);
    const groupEntries = favoriteGroupEntries.get(selectedFavoriteGroupKey) || [];
    const heroImage = activeGroup?.images[0];
    const totalLabel = activeGroup ? `${activeGroup.count} protected housing units` : "Saved properties";
    const subtitle = activeGroup
      ? `your best accommodations in the city of ${activeGroup.cityLabel}`
      : "your best accommodations";

    return (
      <div className="min-h-screen bg-[#FAFAFA] pb-28">
        <main className="px-4 pt-6 max-w-md mx-auto">
          <div className="relative mx-auto h-[190px] w-full max-w-[328px] overflow-hidden">
            {heroImage ? (
              <img src={heroImage} alt={activeGroup?.cityLabel || "Favorites"} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-[#E1E0DF]" aria-hidden="true" />
            )}

            <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 py-3 text-white">
              <button
                type="button"
                onClick={() => setSelectedFavoriteGroupKey(null)}
                className="flex h-6 w-6 items-center justify-center"
                aria-label="Back"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="text-[20px] font-bold leading-5">My recordings</div>
              <div className="flex h-5 w-5 items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10 4.75909C10.5742 4.08742 11.5675 3.33325 13.08 3.33325C15.7258 3.33325 17.5 5.81659 17.5 8.12909C17.5 12.9633 11.4817 16.6666 10 16.6666C8.51833 16.6666 2.5 12.9633 2.5 8.12909C2.5 5.81659 4.27417 3.33325 6.92 3.33325C8.4325 3.33325 9.42583 4.08742 10 4.75909Z"
                    fill="#A3A88D"
                    stroke="white"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {activeGroup?.monthTag ? (
              <div className="absolute left-4 bottom-4 inline-flex items-center rounded-[4px] bg-[linear-gradient(90deg,#3A444A_0.69%,#1E201D_100%)] px-2 py-[3px]">
                <span className="text-[16px] font-normal leading-4 tracking-[-0.32px] text-white">
                  {activeGroup.monthTag}
                </span>
              </div>
            ) : null}

            <div className="absolute left-1/2 bottom-2 flex -translate-x-1/2 items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              <span className="h-1 w-1 rounded-full bg-white" />
              <span className="h-1 w-1 rounded-full bg-white" />
              <span className="h-1 w-1 rounded-full bg-white" />
              <span className="h-0.5 w-0.5 rounded-full bg-white" />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10 4.75909C10.5742 4.08742 11.5675 3.33325 13.08 3.33325C15.7258 3.33325 17.5 5.81659 17.5 8.12909C17.5 12.9633 11.4817 16.6666 10 16.6666C8.51833 16.6666 2.5 12.9633 2.5 8.12909C2.5 5.81659 4.27417 3.33325 6.92 3.33325C8.4325 3.33325 9.42583 4.08742 10 4.75909Z"
                  fill="#A3A88D"
                  stroke="white"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-[16px] font-bold leading-4 tracking-[-0.32px] text-black">
                {totalLabel}
              </div>
            </div>
            <div className="text-[16px] font-normal leading-4 tracking-[-0.32px] text-[#4D4744]">
              {subtitle}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-5">
            {groupEntries.map((entry) => {
              const p = entry.snapshot;
              if (!p) return null;
              return (
                <div key={p.id} className="mx-auto w-full max-w-[328px]">
                  <PropertyCard property={p as unknown as ServiceListItem} />
                </div>
              );
            })}
          </div>
        </main>

        <BottomNav />
      </div>
    );
  }

  // View: Wishlist Collections List
  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32">
      <Header />

      <main className="px-4 pt-6 max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex h-6 w-6 items-center justify-center text-ganitel-text-title"
            aria-label="Back"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-[20px] font-bold leading-5 text-ganitel-text-title">
            My recordings
          </h1>
          <div className="h-6 w-6" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4.80059 4.19995C4.48233 4.19995 4.1771 4.32638 3.95206 4.55142C3.72701 4.77647 3.60059 5.08169 3.60059 5.39995V10.2C3.60059 9.88169 3.72701 9.57647 3.95206 9.35142C4.1771 9.12638 4.48233 8.99995 4.80059 8.99995V8.69995C4.80059 8.38169 4.92701 8.07647 5.15206 7.85142C5.3771 7.62638 5.68233 7.49995 6.00059 7.49995H18.0006C18.3188 7.49995 18.6241 7.62638 18.8491 7.85142C19.0742 8.07647 19.2006 8.38169 19.2006 8.69995V8.99995C19.5188 8.99995 19.8241 9.12638 20.0491 9.35142C20.2742 9.57647 20.4006 9.88169 20.4006 10.2V7.27795C20.4006 6.95969 20.2742 6.65447 20.0491 6.42942C19.8241 6.20438 19.5188 6.07795 19.2006 6.07795H10.5963C10.5003 6.07795 10.4082 6.03775 10.3434 5.96695L10.2414 5.85535L10.1286 5.73205L10.0155 5.60875L9.08369 4.58995C8.97126 4.46707 8.83449 4.36893 8.68208 4.30179C8.52966 4.23464 8.36494 4.19996 8.19839 4.19995H4.80059Z"
                fill="#F2994A"
              />
              <path
                d="M3.60059 10.2C3.60059 9.88174 3.72701 9.57652 3.95206 9.35147C4.1771 9.12643 4.48233 9 4.80059 9H19.2006C19.5188 9 19.8241 9.12643 20.0491 9.35147C20.2742 9.57652 20.4006 9.88174 20.4006 10.2V18.6C20.4006 18.9183 20.2742 19.2235 20.0491 19.4485C19.8241 19.6736 19.5188 19.8 19.2006 19.8H4.80059C4.48233 19.8 4.1771 19.6736 3.95206 19.4485C3.72701 19.2235 3.60059 18.9183 3.60059 18.6V10.2Z"
                fill="#F2C94C"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.00054 7.5C5.68228 7.5 5.37705 7.62643 5.15201 7.85147C4.92697 8.07652 4.80054 8.38174 4.80054 8.7V9H19.2005V8.7C19.2005 8.38174 19.0741 8.07652 18.8491 7.85147C18.624 7.62643 18.3188 7.5 18.0005 7.5H6.00054Z"
                fill="#F2F2F2"
              />
            </svg>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => {
                setActiveTab("favorites");
                setSelectedCollectionId(null);
                setSelectedFavoriteGroupKey(null);
              }}
              className={
                activeTab === "favorites"
                  ? "rounded-lg bg-[#18100C] px-3 py-2 text-[14px] font-normal leading-4 tracking-[-0.28px] text-white"
                  : "rounded-lg bg-[#EAEEE7] px-3 py-2 text-[14px] font-normal leading-4 tracking-[-0.28px] text-[#18100C]"
              }
            >
              favorites ({favoriteEntries.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("collections");
                setSelectedFavoriteGroupKey(null);
              }}
              className={
                activeTab === "collections"
                  ? "rounded-lg bg-[#18100C] px-3 py-2 text-[14px] font-normal leading-4 tracking-[-0.28px] text-white"
                  : "rounded-lg bg-[#EAEEE7] px-3 py-2 text-[14px] font-normal leading-4 tracking-[-0.28px] text-[#18100C]"
              }
            >
              Collections
            </button>
          </div>
        </div>

        <div className="mt-4 h-px w-full bg-[#E1E0DF]" />

        {activeTab === "favorites" ? (
          <div className="mt-10 flex flex-col items-center">
            {favoriteEntries.length === 0 ? (
              <>
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/88fc87e2de019e4e34b0a9eb93266fcbba46f1a7?width=344"
                  alt="Empty favorites"
                  className="h-[133px] w-[172px]"
                />
                <p className="mt-6 max-w-[164px] text-center text-[16px] font-normal leading-[18px] tracking-[-0.32px] text-[#67615F]">
                  No properties saved. Add your favorite apartments to easily find them here.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="mt-10 flex h-[45px] w-[328px] items-center justify-center rounded-lg bg-[#E1E0DF] text-[18px] font-bold leading-[18px] text-[#18100C]"
                >
                  Explore accommodation
                </button>
              </>
            ) : (
              <div className="mt-6 w-full space-y-6">
                {favoriteGroups.map((group) => (
                  <div
                    key={group.key}
                    className="relative w-full max-w-[328px] mx-auto rounded-lg bg-[#C5C3C2] p-5 overflow-hidden cursor-pointer"
                    onClick={() => setSelectedFavoriteGroupKey(group.key)}
                  >
                    <div className="relative h-[154px] w-[288px] mx-auto">
                      <svg
                        className="absolute left-[12px] top-0 h-[151px] w-[275px]"
                        viewBox="0 0 275 151"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M257 18.5H82.7305C77.5038 18.5 72.5351 16.2281 69.116 12.2747L63.884 6.22527C60.4649 2.27193 55.4963 0 50.2695 0H18C8.05888 0 0 8.05887 0 18V133C0 142.941 8.05887 151 18 151H257C266.941 151 275 142.941 275 133V36.5C275 26.5589 266.941 18.5 257 18.5Z"
                          fill="#CDB9A3"
                          stroke="#CDB9A3"
                        />
                      </svg>

                      <div className="relative z-10 mt-5 w-full rounded-lg bg-white p-4 shadow-[0_24px_48px_-12px_rgba(16,24,40,0.18)]">
                        <div className="flex items-center gap-2.5">
                          {[0, 1, 2].map((index) => {
                            const image = group.images[index];
                            return image ? (
                              <img
                                key={index}
                                src={image}
                                alt={group.cityLabel}
                                className="h-[61px] w-[78px] rounded object-cover"
                              />
                            ) : (
                              <div
                                key={index}
                                className="h-[61px] w-[78px] rounded bg-[#E1E0DF]"
                                aria-hidden="true"
                              />
                            );
                          })}
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex flex-col gap-2">
                            <div className="text-[16px] font-bold leading-4 tracking-[-0.32px] text-[#18100C]">
                              {group.label}
                            </div>
                            <div className="text-[16px] font-normal leading-4 tracking-[-0.32px] text-[#67615F]">
                              {String(group.count).padStart(2, "0")} accommodations
                            </div>
                          </div>
                          <button
                            type="button"
                            className="text-[16px] font-normal leading-4 tracking-[-0.32px] text-black"
                            aria-label="More actions"
                            onClick={(event) => event.stopPropagation()}
                          >
                            ...
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : collections.length === 0 ? (
          <div className="mt-10 flex flex-col items-center">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/ee5a35f2de7fbfcb183d34131013bf6cc48f76b3?width=456"
              alt="Empty collections"
              className="h-[188px] w-[228px]"
            />
            <p className="mt-6 max-w-[242px] text-center text-[16px] font-normal leading-[18px] tracking-[-0.32px] text-[#67615F]">
              You don&apos;t have a collection yet. Organize your properties by project, city or budget.
            </p>
            <button
              type="button"
              onClick={openCreateDrawer}
              className="mt-10 flex h-[44px] w-[328px] items-center justify-center gap-2 rounded-lg bg-[#E1E0DF] text-[18px] font-bold leading-[18px] text-[#000000]"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 4.75C12.69 4.75 13.25 5.31 13.25 6V10.75H18C18.3315 10.75 18.6495 10.8817 18.8839 11.1161C19.1183 11.3505 19.25 11.6685 19.25 12C19.25 12.3315 19.1183 12.6495 18.8839 12.8839C18.6495 13.1183 18.3315 13.25 18 13.25H13.25V18C13.25 18.3315 13.1183 18.6495 12.8839 18.8839C12.6495 19.1183 12.3315 19.25 12 19.25C11.6685 19.25 11.3505 19.1183 11.1161 18.8839C10.8817 18.6495 10.75 18.3315 10.75 18V13.25H6C5.66848 13.25 5.35054 13.1183 5.11612 12.8839C4.8817 12.6495 4.75 12.3315 4.75 12C4.75 11.6685 4.8817 11.3505 5.11612 11.1161C5.35054 10.8817 5.66848 10.75 6 10.75H10.75V6C10.75 5.31 11.31 4.75 12 4.75Z"
                  fill="#1E1E1E"
                />
              </svg>
              create your first collection
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-4">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="flex items-center justify-between rounded-[20px] bg-ganitel-neutral-3/50 p-3 hover:bg-ganitel-neutral-3 transition-colors cursor-pointer group animate-in fade-in slide-in-from-bottom-2 duration-300"
                onClick={() => setSelectedCollectionId(collection.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-[52px] h-[52px] rounded-xl overflow-hidden flex-shrink-0 bg-white shadow-sm border border-black/5">
                    <img
                      src={collection.imageUrl}
                      alt={collection.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-ganitel-text-title leading-tight">
                      {collection.name}
                    </span>
                    <span className="text-sm text-ganitel-text-label font-medium">
                      {collection.count} properties
                    </span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button className="p-2 text-ganitel-text-title hover:bg-black/5 rounded-full transition-colors active:scale-90">
                      <MoreVertical className="w-6 h-6" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl p-1 min-w-[140px]">
                    <DropdownMenuItem
                      className="rounded-lg gap-2 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        openRenameDrawer(
                          collection.id,
                          collection.name,
                          collection.description || "",
                        );
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="rounded-lg gap-2 text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCollection(collection.id, collection.name);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ganitel-neutral-3/50 px-4 py-6 mt-4 text-base font-bold text-ganitel-text-title hover:bg-ganitel-neutral-3 transition-all active:scale-[0.98]"
              onClick={openCreateDrawer}
            >
              <Plus className="h-6 w-6 stroke-[3px]" />
              {collections.length === 0 ? "create your first collection" : "create a collection"}
            </button>
          </div>
        )}
      </main>

      <BottomNav />

      {/* Action Drawer (Create or Rename) */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="rounded-t-2xl border border-ganitel-stroke-neutral p-0">
          <div className="mx-auto mt-3 h-px w-[33px] bg-[#E1E0DF]" />
          <div className="px-4 pb-6 pt-6">
            <DrawerHeader className="p-0">
              <div className="flex items-center gap-2">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <path
                    d="M16.5518 6.66667H27.9998C28.3535 6.66667 28.6926 6.80714 28.9426 7.05719C29.1927 7.30724 29.3332 7.64638 29.3332 8V26.6667C29.3332 27.0203 29.1927 27.3594 28.9426 27.6095C28.6926 27.8595 28.3535 28 27.9998 28H3.99984C3.64622 28 3.30708 27.8595 3.05703 27.6095C2.80698 27.3594 2.6665 27.0203 2.6665 26.6667V5.33333C2.6665 4.97971 2.80698 4.64057 3.05703 4.39052C3.30708 4.14048 3.64622 4 3.99984 4H13.8852L16.5518 6.66667ZM5.33317 9.33333V25.3333H26.6665V9.33333H5.33317Z"
                    fill="#000000"
                  />
                </svg>
                <DrawerTitle className="text-[28px] font-bold leading-7 text-ganitel-text-title">
                  {drawerMode === "create" ? "Add to a collection" : "Edit collection"}
                </DrawerTitle>
              </div>
            </DrawerHeader>

            <div className="mt-8 flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <span className="text-[14px] font-bold leading-4 tracking-[-0.28px] text-[#000000]">
                  Collection name
                </span>
                <div className="flex items-center gap-2">
                  <img
                    src="https://api.builder.io/api/v1/image/assets/TEMP/77a3f24351344bbf6ad40fb5e5318c9293fe58d0?width=88"
                    alt="Collection"
                    className="h-11 w-11"
                  />
                  <Input
                    value={collectionNameInput}
                    onChange={(event) => setCollectionNameInput(event.target.value)}
                    placeholder="e.g. '' My favorite apartments''"
                    className="h-11 flex-1 rounded-lg border-none bg-[#F6F5F5] px-4 text-[16px] font-normal leading-4 tracking-[-0.32px] text-[#18100C] placeholder:text-[#67615F]"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <span className="text-[16px] font-bold leading-4 tracking-[-0.32px] text-[#000000]">
                  Description
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#18100C]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M8 18H16V16H8V18ZM8 14H16V12H8V14ZM6 22C5.45 22 4.97933 21.8043 4.588 21.413C4.19667 21.0217 4.00067 20.5507 4 20V4C4 3.45 4.196 2.97933 4.588 2.588C4.98 2.19667 5.45067 2.00067 6 2H14L20 8V20C20 20.55 19.8043 21.021 19.413 21.413C19.0217 21.805 18.5507 22.0007 18 22H6ZM13 9H18L13 4V9Z"
                        fill="#FFFFFF"
                      />
                    </svg>
                  </div>
                  <Input
                    value={collectionDescriptionInput}
                    onChange={(event) => setCollectionDescriptionInput(event.target.value)}
                    placeholder="Add a short description"
                    className="h-11 flex-1 rounded-lg border-none bg-[#F6F5F5] px-4 text-[16px] font-normal leading-4 tracking-[-0.32px] text-[#18100C] placeholder:text-[#67615F]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 pb-6">
            <button
              type="button"
              onClick={handleDrawerAction}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#18100C] text-[16px] font-normal leading-4 tracking-[-0.32px] text-white"
            >
              {drawerMode === "create" ? "Add to collection" : "Save changes"}
              <span className="flex items-center rounded bg-[rgba(116,112,109,0.40)] p-0.5">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M15.8337 9.99992H4.16699" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11.667 14.1667L15.8337 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11.667 5.83325L15.8337 9.99992" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
            <DrawerClose asChild>
              <button
                type="button"
                className="mt-3 w-full text-center text-[14px] font-medium text-[#67615F]"
              >
                Cancel
              </button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
