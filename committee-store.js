(function () {
  const STORAGE_KEY = 'iemUmpsaCommitteeDataV1';

  const departments = [
    { id: 'civil', name: 'Civil Engineering', icon: 'CE', order: 1 },
    { id: 'chemical', name: 'Chemical Engineering', icon: 'CH', order: 2 },
    { id: 'mechanical', name: 'Mechanical & Mechatronic Engineering', icon: 'ME', order: 3 },
    { id: 'electrical', name: 'Electrical & Electronics Engineering', icon: 'EE', order: 4 },
    { id: 'publicity', name: 'Publicity', icon: 'PR', order: 5 },
    { id: 'multimedia', name: 'Multimedia', icon: 'MM', order: 6 }
  ];

  const defaultMembers = [
    { id: 'management-chairperson', group: 'management', department: '', position: 'Chairperson', name: 'Nasriah Aqilah Binti Mohd Nazeri', photo: '', order: 1, published: true, fixed: true },
    { id: 'management-vc-internal', group: 'management', department: '', position: 'Vice Chairperson · Internal', name: 'Muhammad Iman Hakim Bin Abdullah', photo: '', order: 2, published: true, fixed: true },
    { id: 'management-vc-external', group: 'management', department: '', position: 'Vice Chairperson · External', name: 'Maxwill Tan Jen Hong', photo: '', order: 3, published: true, fixed: true },
    { id: 'management-treasurer', group: 'management', department: '', position: 'Treasurer', name: 'Teoh Jie Yang', photo: '', order: 4, published: true, fixed: true },
    { id: 'management-vice-treasurer', group: 'management', department: '', position: 'Vice Treasurer', name: 'Charisma Emerald Sendi Anak Brendan Ullok', photo: '', order: 5, published: true, fixed: true },
    { id: 'management-secretary', group: 'management', department: '', position: 'Secretary', name: 'Tay Chia Xin', photo: '', order: 6, published: true, fixed: true },
    { id: 'management-vice-secretary', group: 'management', department: '', position: 'Vice Secretary', name: 'Sujita A/P Prem Kumar', photo: '', order: 7, published: true, fixed: true },

    { id: 'civil-hod', group: 'department', department: 'civil', position: 'HOD', name: 'Nurlisa Elya Binti Nasruddin', photo: '', order: 1, published: true, fixed: true },
    { id: 'civil-asst-hod', group: 'department', department: 'civil', position: 'Asst HOD', name: 'Wilson Low Kai Jing', photo: '', order: 2, published: true, fixed: true },
    { id: 'civil-member-1', group: 'department', department: 'civil', position: 'Member', name: 'Leong Jia En', photo: '', order: 3, published: true, fixed: true },
    { id: 'civil-member-2', group: 'department', department: 'civil', position: 'Member', name: 'Yashika A/P Balachandran', photo: '', order: 4, published: true, fixed: true },
    { id: 'civil-member-3', group: 'department', department: 'civil', position: 'Member', name: 'Sweetha A/P Sriraj', photo: '', order: 5, published: true, fixed: true },

    { id: 'chemical-hod', group: 'department', department: 'chemical', position: 'HOD', name: 'Shena Miftahul Haroma Binti Sukardi', photo: '', order: 1, published: true, fixed: true },
    { id: 'chemical-asst-hod', group: 'department', department: 'chemical', position: 'Asst HOD', name: 'Thareshiny A/P Gunasegaran', photo: '', order: 2, published: true, fixed: true },
    { id: 'chemical-member-1', group: 'department', department: 'chemical', position: 'Member', name: 'Chia Kai Chun', photo: '', order: 3, published: true, fixed: true },
    { id: 'chemical-member-2', group: 'department', department: 'chemical', position: 'Member', name: 'Nicholas Henry', photo: '', order: 4, published: true, fixed: true },
    { id: 'chemical-member-3', group: 'department', department: 'chemical', position: 'Member', name: 'Kesavaaraj A/L Rajentharan', photo: '', order: 5, published: true, fixed: true },

    { id: 'mechanical-hod', group: 'department', department: 'mechanical', position: 'HOD', name: 'Haemabarathi A/P Ramachandran', photo: '', order: 1, published: true, fixed: true },
    { id: 'mechanical-asst-hod', group: 'department', department: 'mechanical', position: 'Asst HOD', name: 'Ho Wen Tao', photo: '', order: 2, published: true, fixed: true },
    { id: 'mechanical-member-1', group: 'department', department: 'mechanical', position: 'Member', name: '', photo: '', order: 3, published: true, fixed: true },
    { id: 'mechanical-member-2', group: 'department', department: 'mechanical', position: 'Member', name: '', photo: '', order: 4, published: true, fixed: true },
    { id: 'mechanical-member-3', group: 'department', department: 'mechanical', position: 'Member', name: '', photo: '', order: 5, published: true, fixed: true },

    { id: 'electrical-hod', group: 'department', department: 'electrical', position: 'HOD', name: '', photo: '', order: 1, published: true, fixed: true },
    { id: 'electrical-asst-hod', group: 'department', department: 'electrical', position: 'Asst HOD', name: '', photo: '', order: 2, published: true, fixed: true },
    { id: 'electrical-member-1', group: 'department', department: 'electrical', position: 'Member', name: '', photo: '', order: 3, published: true, fixed: true },
    { id: 'electrical-member-2', group: 'department', department: 'electrical', position: 'Member', name: '', photo: '', order: 4, published: true, fixed: true },
    { id: 'electrical-member-3', group: 'department', department: 'electrical', position: 'Member', name: '', photo: '', order: 5, published: true, fixed: true },

    { id: 'publicity-hod', group: 'department', department: 'publicity', position: 'HOD', name: 'Thibanu A/P Chandran', photo: '', order: 1, published: true, fixed: true },
    { id: 'publicity-asst-hod', group: 'department', department: 'publicity', position: 'Asst HOD', name: 'Siti Bainun Binti Mohamad', photo: '', order: 2, published: true, fixed: true },
    { id: 'publicity-member-1', group: 'department', department: 'publicity', position: 'Member', name: 'Vindhya A/P Siva', photo: '', order: 3, published: true, fixed: true },
    { id: 'publicity-member-2', group: 'department', department: 'publicity', position: 'Member', name: 'Lee Ann', photo: '', order: 4, published: true, fixed: true },
    { id: 'publicity-member-3', group: 'department', department: 'publicity', position: 'Member', name: '', photo: '', order: 5, published: true, fixed: true },

    { id: 'multimedia-hod', group: 'department', department: 'multimedia', position: 'HOD', name: 'Maithili A/P Vijayandran', photo: '', order: 1, published: true, fixed: true },
    { id: 'multimedia-asst-hod', group: 'department', department: 'multimedia', position: 'Asst HOD', name: 'Muhammad Yamin Bin Mohd Asri', photo: '', order: 2, published: true, fixed: true },
    { id: 'multimedia-member-1', group: 'department', department: 'multimedia', position: 'Member', name: 'Fatin Ila Nabila Binti Mah Hussin', photo: '', order: 3, published: true, fixed: true },
    { id: 'multimedia-member-2', group: 'department', department: 'multimedia', position: 'Member', name: 'Sharvina Santhara Sageran', photo: '', order: 4, published: true, fixed: true },
    { id: 'multimedia-member-3', group: 'department', department: 'multimedia', position: 'Member', name: '', photo: '', order: 5, published: true, fixed: true }
  ];

  let memoryMembers = defaultMembers.map(member => ({ ...member }));

  function cloneMembers(members) {
    return members.map(member => ({ ...member }));
  }

  function readStoredMembers() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(defaultMembers)
        );
        return cloneMembers(defaultMembers);
      }

      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        throw new Error('Invalid committee data');
      }

      return parsed;
    } catch (error) {
      // Some static previews restrict browser storage.
      // The website should still render using the built-in committee list.
      return cloneMembers(memoryMembers);
    }
  }

  function writeStoredMembers(members) {
    memoryMembers = cloneMembers(members);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(members)
      );
    } catch (error) {
      // Keep the in-memory copy working even if browser storage is unavailable.
      console.warn(
        'Committee changes are available for this page session only because browser storage is unavailable.',
        error
      );
    }
  }

  async function ensureSeedData() {
    const members = readStoredMembers();
    memoryMembers = cloneMembers(members);
    return members;
  }

  async function getAllMembers() {
    const members = readStoredMembers();
    memoryMembers = cloneMembers(members);
    return cloneMembers(members);
  }

  async function saveMember(member) {
    const members = readStoredMembers();
    const index = members.findIndex(item => item.id === member.id);

    if (index >= 0) {
      members[index] = { ...member };
    } else {
      members.push({ ...member });
    }

    writeStoredMembers(members);
    return { ...member };
  }

  async function deleteMember(id) {
    const members = readStoredMembers().filter(
      member => member.id !== id
    );

    writeStoredMembers(members);
  }

  function makeId(prefix = 'committee') {
    if (crypto.randomUUID) {
      return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`;
  }

  function sortMembers(members) {
    return [...members].sort((a, b) => {
      const aGroup =
        a.group === 'management' ? 0 : 1;

      const bGroup =
        b.group === 'management' ? 0 : 1;

      if (aGroup !== bGroup) {
        return aGroup - bGroup;
      }

      if (
        a.group === 'department' &&
        b.group === 'department'
      ) {
        const aDept =
          departments.find(
            item => item.id === a.department
          )?.order || 999;

        const bDept =
          departments.find(
            item => item.id === b.department
          )?.order || 999;

        if (aDept !== bDept) {
          return aDept - bDept;
        }
      }

      return (
        (Number(a.order) || 999) -
        (Number(b.order) || 999)
      );
    });
  }

  function departmentInfo(id) {
    return departments.find(
      item => item.id === id
    ) || null;
  }

  function resetToDefault() {
    const members = cloneMembers(defaultMembers);
    writeStoredMembers(members);
    return members;
  }

  window.IEMCommitteeStore = {
    departments,
    ensureSeedData,
    getAllMembers,
    saveMember,
    deleteMember,
    makeId,
    sortMembers,
    departmentInfo,
    resetToDefault
  };
})();
